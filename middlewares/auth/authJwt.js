import jwt from 'jsonwebtoken';

import authConfig from '../../configs/auth.config.js';

function catchError(err, res) { 
    if (err instanceof TokenExpiredError) {
        return res.status(401).json({error: "Unauthorized! Access Token was expired!"});    
    }
    return res.status(401).json({error: "Unauthorized!"});
}

export function verifyToken(req, res, next) {
    let token = req.headers['x-access-token'];

    if (!token) {
        return res.status(403).send({
            error: 'Insufficient credentials!'
        })
    }

    jwt.verify(token, authConfig.secret, (err, decoded) => {
        if (err) {
            return catchError(err, res)
        }
        req.traderId = decoded.id;
        next()
    })
}

