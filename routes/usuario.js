import express from 'express'
import { Router } from 'express'
import Usuario from '../models/usuario.js'
import bcrypt from 'bcrypt'
import passport from 'passport'

const router = new Router();

router.get('/cadastro', (req, res) => {
    res.render("usuarios/cadastro");
})

// middleware validar cadastro
function validaCadastro(req, res, next) {
        let erros = [];
        
        if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome.trim() === ''){
            erros.push({texto: "Nome Invalido!"});
        }
        if(!req.body.email || typeof req.body.email == undefined || req.body.email.trim() === ''){
            erros.push({texto: "Email Invalido!"});
        }
        if(!req.body.senha || typeof req.body.senha == undefined || req.body.senha.trim() === ''){
            erros.push({texto: "Senha Invalida!"});
        }
        if(req.body.senha.length <= 4){
            erros.push({texto: "Senha muito fraca"});
        }
        if(req.body.senha != req.body.senha2) {
            erros.push({texto: "As senhas sao diferentes!"})
        }
        if(erros.length > 0) {
            res.render("usuarios/cadastro", {erros: erros})
        }
        next();
    }

router.post('/cadastro', validaCadastro, (req, res) => {
    Usuario.findOne({email: req.body.email})
        .then((usuario) => {
            if(usuario){
                req.flash("error_msg", "E-mail ja cadastrado")
                return res.redirect("/usuarios/cadastro")
            }
            const novoUsuario = new Usuario({
                nome: req.body.nome,
                email: req.body.email,
                senha: req.body.senha
            });
            bcrypt.genSalt(10, (erro, salt) => {
                if(erro) {
                    req.flash("error_msg", "Erro interno");
                    return res.redirect("/")
                }
            bcrypt.hash(novoUsuario.senha, salt, (erro, hash) => {
                if(erro){
                    req.flash("error_msg", "Houve um erro durante ao tentar salvar o usuario");
                    return res.redirect("/");
                }

            novoUsuario.senha = hash;

            novoUsuario.save()
            .then(() => {
                req.flash("success_msg", "usuario criado com sucesso");
                return res.redirect("/");
            })
            .catch((err) => {
                console.error(err);
                req.flash("error_msg", "Houve um erro ao criar o usuario, tente novamente!!")
                return res.redirect("/usuarios/cadastro")
            });
        });
    });
})
.catch((err) =>{
    req.flash("error_msg", "Houve um erro interno")
    return res.redirect("/")
})  
})

router.get('/login', (req, res) => {
    res.render("usuarios/login")
})

router.post('/login', (req, res, next) => {
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/usuarios/login",
        failureFlash: true
    })(req, res, next)
})

router.get('/logout', (req,res, next) => {
    req.logout((err)=> {
        if(err){
            return next(err)
        };
    req.flash('success_msg', "Deslogado com sucesso")
    res.redirect("/")
    });
})
export default router