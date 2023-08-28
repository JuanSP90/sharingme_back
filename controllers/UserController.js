const User = require("../modules/userModel");
const jwt = require("jsonwebtoken");
const mySecret = process.env.MYSECRET;
const bcrypt = require("bcrypt");
const transporter = require('../mailConfig')

const UserController = {
    loginUser: async (req, res) => {
        const { email, password } = req.body;

        try {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ error: "El usuario no existe" });
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({ error: "Contraseña inválida" });
            }

            const token = jwt.sign({ user: user.email, id: user._id }, mySecret, {
                expiresIn: "1h",
            });
            return res.json({ message: "Inicio de sesión exitoso", token })
        } catch (error) {
            res.status(500).json({ error: "Error al logearse" });
        }
    },

    getUsers: async (req, res) => {
        try {
            const users = await User.find();
            const modifiedUsers = users.map(user => ({
                _id: user._id,
                userName: user.userName,
                backgroundColor: user.backgroundColor,
                tag1: user.tag1,
                tag2: user.tag2,
                tag3: user.tag3,
                links: user.links,
                description: user.description,
                location: user.location
            }));

            res.json(modifiedUsers);
        } catch (error) {
            res.status(500).json({ error: "Error al traer los usuarios" });
        }
    },

    getUserMapAndCount: async (req, res) => {
        try {
            const users = await User.find();
            const locations = users.map(user => user.location);
            const userCount = users.length;
            const uniqueLocationCount = new Set(locations.filter(location => location)).size;
            res.json({ locations, userCount, uniqueLocationCount });
        } catch (error) {
            res.status(500).json({ error: "Error al traer las ubicaciones y el número de usuarios para el mapa" });
        }
    },

    getUser: async (req, res) => {
        const { userName } = req.params;
        try {
            const user = await User.findOne({ userName: userName });
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: "Error al buscar el usuario" });
        }
    },

    getUserProfile: async (req, res) => {
        try {
            const { email, _id, userName, role, links, description, backgroundColor } = await User.findById(req.userInfo.id)
            res.json({ email, _id, userName, role, links, description, backgroundColor });
        } catch (error) {
            res.status(500).json({ error: "Error al buscar el usuario en /me" });
        }
    },

    addUser: async (req, res) => {
        const { email, password, userName } = req.body;
        try {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {

                return res.status(401).json({ error: "El email ya está registrado" });
            }
            const existingUserName = await User.findOne({ userName });
            if (existingUserName) {
                return res
                    .status(401)
                    .json({ error: "El nombre de usuario ya está registrado" });
            }
            const newUser = new User({
                email,
                password,
                userName,
                role: 1,
                links: [],
                description: '',
                backgroundColor: '',
                location: '',
                tag1: '',
                tag2: '',
                tag3: ''
            });
            await newUser.save();

            const token = jwt.sign(
                { user: newUser.email, id: newUser._id },
                mySecret,
                { expiresIn: "1h" }
            );

            const mailOptions = {
                to: newUser.email,
                subject: "Bienvenido a SharingMe ",
                text: "Bienvenido a nuestra red social donde podras personalizar tu perfil y compartir todos tus enlaces",
            }

            try {
                await transporter.sendMail(mailOptions);
            } catch (error) {
                console.log(error);
            }
            res.json({ message: "Registro exitoso", token });

        } catch (error) {
            res.status(500).json({ error: "Error en el servidor" });
        }
    },

    updateUserConfig: async (req, res) => {
        const userId = req.userInfo.id;
        const { userName, password, email, description, backgroundColor, links, location, tag1, tag2, tag3 } = req.body;

        try {
            if (password) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                await User.findByIdAndUpdate(
                    userId,
                    { $set: { password: hashedPassword } },
                    { new: true })
            }

            if (userName) {
                const existingUserName = await User.findOne({ userName });

                if (existingUserName) {
                    return res
                        .status(401)
                        .json({ error: "El nombre de usuario ya está registrado" });
                }
            }

            if (email) {
                const existingEmail = await User.findOne({ email });
                if (existingEmail) {
                    console.log('soy existingEmail', existingEmail)
                    return res.status(401).json({ error: "El email ya está registrado" });
                }
            }

            if ((tag1 && tag1.length > 10) || (tag2 && tag2.length > 10) || (tag3 && tag3.length > 10)) {
                return res.status(400).json({ error: 'Longitud máxima excedida' });
            }

            const user = await User.findByIdAndUpdate(
                userId,
                { $set: { userName, email, backgroundColor, links, description, location, tag1, tag2, tag3 } },
                { new: true }
            );

            res.json(user);
        } catch (error) {
            console.error('Error al actualizar el usuario en el backend:', error);
            res.status(500).json({ error: 'Error al actualizar el usuario en el backend:' });
        }
    },

    forgotPassword: async (req, res) => {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (user) {
            try {
                const randomPassword = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
                user.password = randomPassword;
                await user.save();

                const mailOptions = {
                    to: email,
                    subject: "Recupera tu contraseña de SharingMe ",
                    text: `Aqui le mandamos una nueva contraseña, porfavor entre a su perfil y cambiela.

                    Nueva Contraseña: ${randomPassword}
                    
                    Muchas gracias por confiar en nosotros, SharingMe`,
                }


                await transporter.sendMail(mailOptions);
                return res
                    .status(200)
                    .json("Email con nueva contraseña enviado con exito");

            } catch (error) {
                console.error('Error al enviar la forgotPassword', error);
                res.status(500).json({ error: 'Error al enviar la forgotPassword' });
            }
        }

    }
};

module.exports = UserController;
