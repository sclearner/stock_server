import {Trader, Sequelize} from '../models/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import authConfig from '../configs/auth.config.js';

const Op = Sequelize.Op;

export function signup(req, res) {
    Trader.create({
        name: req.body.name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 8)
    }).then(
        user => {
            res.json({message: "Trader was successfully registered"})
        }
    ).catch(err => {
        res.status(500).send({message: err.message});
    })
}

export function signin(req, res) {
    Trader.findOne({
        where: {
            username: req.user.username
        }
    })
    .then(trader => {
        if (!trader) return res.status(404).json({
            error: 'Trader not found.'
        })

        let passwordIsValid = bcrypt.compareSync(
            req.body.password,
            trader.password,
        );

        if (!passwordIsValid) {
            return res.status(401).json({
                accessToken: null,
                error: "Invalid password!"
            });
        }

        const token = jwt.sign({id: trader.id}, authConfig.secret, {
            algorithm: 'HS256',
            allowInsecureKeySizes: true,
            expiresIn: 86400
        });

        res.status(200).json({
            id: trader.id,
            name: trader.name,
            email: trader.email,
            accessToken: token,
        })
    }).catch(err => {
        res.status(500).json({error: err.message});
    })
}