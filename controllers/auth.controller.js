import {db} from '../models/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import authConfig from '../configs/auth.config.js';
import currencyConfig from '../configs/currency.config.js';

const {Trader, RefreshToken, Instrument, TraderBalance, sequelize} = db;
export function signUpClient(req, res) {
    req.trader.save().then(
        _user => {
            res.status(201).json({message: "Trader was successfully registered"})
        }
    ).catch(err => {
        res.status(500).send({error: err.message});
    })
}

export async function signUpCorp(req, res) {
    req.trader.role = 'CORP';
    const {symbol, amount, initPrice} = req.body;
    
    try {
        await sequelize.transaction(async (t) => {
            await req.trader.save({transaction: t});
            await Instrument.create({
                symbol, 
                currency: currencyConfig.defaultCurrency,
                dayPrice: initPrice || 10000
            }, {transaction: t});
            await TraderBalance.create({
                id: req.trader.id,
                currency: symbol,
                amount: amount
            }, {transaction: t});
        });

        res.status(201).json({message: "Corporation was created successfully!"})
    }
    catch (err) {
        res.status(500).json({error: err.message});
    }
}

export function signin(req, res) {
    Trader.findOne({
        where: {
            name: req.body.name
        },
        attributes: ['id', 'password']
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
            expiresIn: 7 * 24 * 3600 
        });

        const refreshToken = await RefreshToken.createToken(trader);
        
        res.status(200).json({
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
        return res.status(500).json({error});
    }
}