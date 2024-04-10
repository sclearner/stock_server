import {Trader} from "../../models/index.js";

/**
 * Middleware for checking the existence of given
 * emails in req.body.email of POST '/api/signup'
 * @param {Request} req
 * @param {Response} res  
 * @param {(req: Request, res: Response) => {}} next 
 */
export function checkDuplicate(req, res, next) {
    Trader.findOne({
        where: {
            email: req.body.email,
        }
    }).then(user => {
        if (user) {res.status(400).json({
            'error': 'Email is already in use!'
        })
        return ;
        }
        next();  
    })
}

export function checkEmail(req, res, next) {
    
}