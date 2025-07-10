import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt'
import Usuario from '../models/usuario.js'
import usuario from '../models/usuario.js';


export default function(passport){

    passport.use(new LocalStrategy({usernameField: 'email', passwordField: 'senha'}, (email, senha, done) => {
        Usuario.findOne({email: email})
        .then((usuario) => {
            if(!usuario) {
                return done(null, false, {message: "usuario não cadastrado"})
            }

            bcrypt.compare(senha, usuario.senha, (erro, batem) => {
                if(batem) {
                    return done(null, usuario)
                }
                else {
                    return done(null, false, {message: "senha incorreta!"})
                }
            })
        })
    }))

    passport.serializeUser((usuario, done) => {
        done(null, usuario.id)
    })

    passport.deserializeUser((id, done) => {
        Usuario.findById(id)
        .then((Usuario) => {
            done(null, Usuario)
        }) 
        .catch((err) => {
            done(err)
        })
    })
}
