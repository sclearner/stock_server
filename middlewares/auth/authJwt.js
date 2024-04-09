import jwt from 'jsonwebtoken';

import authConfig from './configs/auth.config.js';

import {Trader} from './models';

export function verifyToken(req, res, next) {
    let token = req.headers['x-access-token'];

    if (!token) {
        return res.status(403).send({
            error: 'Insufficient credentials!'
        })
    }

    jwt.verify(token, authConfig.secret, (err, decoded) => {
        if (err) {
            return res.status(401).send({
                error: 'Unauthorized!'
            });
        }
        req.userId = decoded.id;
        next()
    })
}

