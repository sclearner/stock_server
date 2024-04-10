import {Trader, Sequelize, RefreshToken} from '../models/index.js';
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
        _user => {
            res.json({message: "Trader was successfully registered"})
        }
    ).catch(err => {
        res.status(500).send({message: err.message});
    })
}

export function signin(req, res) {
    Trader.findOne({
        where: {
            name: req.body.name
        }
    })
    .then(async trader => {
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

        const refreshToken = await RefreshToken.createToken(trader);

        res.status(200).json({
            id: trader.id,
            name: trader.name,
            email: trader.email,
            accessToken: token,
            refreshToken: refreshToken
        })
    }).catch(err => {
        res.status(500).json({error: err.message});
    })
}

export async function refreshToken(req, res) {
    const requestToken = req.body.refreshToken;

    if (requestToken === null) {
        return res.status(403).json({error: 'Refresh Token is required!'});
    }

    try {
        let refreshToken = await RefreshToken.findOne({
            where: {token: requestToken}
        })

        if (!refreshToken) {
            return res.status(403).json({error: 'Refresh Token is not in database!'});
        }

        if (RefreshToken.verifyExpiration(refreshToken)) { 
            RefreshToken.destroy({where: {id: refreshToken.id}})

            return res.status(403).json({error: 'Refresh Token was expired'})
        }    
        const trader = refreshToken.getTrader()

        let newAccessToken = jwt.sign({id: trader.id}, authConfig.secret, {
            expiresIn: authConfig.jwtExpiration,
        });

        res.status(200).json({accessToken: newAccessToken, refreshToken: refreshToken.token});
        return;
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({error});
    }
}