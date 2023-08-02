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
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: "Error al traer los usuarios" });
        }
    },

    // getUser: async (req, res) => {
    //     const { userId } = req.params;
    //     try {
    //         const user = await User.findOne({ _id: userId });
    //         res.json(user);
    //     } catch (error) {
    //         res.status(500).json({ error: "Error al buscar el usuario" });
    //     }
    // },
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
            console.log('soy el req.info en UserController', req.userInfo.id)
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
                geolocation: ''
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

            // console.log('despues de enviar mail');
            res.json({ message: "Registro exitoso", token });

        } catch (error) {
            res.status(500).json({ error: "Error en el servidor" });
            console.log('el error en el usecontroller en el adduser', error)
        }
    },

    // deleteUser: async (req, res) => {
    //     const { role } = await User.findById(req.userInfo.id);
    //     if (role === 2) {
    //         const { userId } = req.params;
    //         await User.deleteOne({ _id: userId });
    //         res.json(`El usuario con id ${userId} ha sido eliminado`);
    //     }
    // },

    // putUser: async (req, res) => {
    //     const { userId } = req.params;
    //     await User.findOneAndReplace({ _id: userId }, { ...req.body });
    //     const user = await User.findOne({ _id: userId });
    //     res.json(user);
    // },

    // updateUser: async (req, res) => {
    //     const { userName, password, email, role, links, description, backgroundColor } = await User.findById(req.userInfo.id);
    //     if (role === 2) {
    //         await User.updateOne(
    //             { _id: userId },
    //             {
    //                 $set: {
    //                     userName,
    //                     email,
    //                     password,
    //                     role,
    //                     links,
    //                     description,
    //                     backgroundColor
    //                 },
    //             }
    //         );
    //     } else {
    //         res.json('No tiene autorizacion para realizar esta tarea')
    //     }
    // },
    updateUserConfig: async (req, res) => {
        const userId = req.userInfo.id;
        const { userName, password, email, description, backgroundColor, links, geolocation } = req.body;


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
            const user = await User.findByIdAndUpdate(
                userId,
                { $set: { userName, email, backgroundColor, links, description, geolocation } },
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
                // await User.updateOne(
                //     { $set: { password: randomPassword } }
                // )

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
