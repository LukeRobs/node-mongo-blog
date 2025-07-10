import Express from 'express';
import dotenv from "dotenv";
import exphbs from 'express-handlebars';
import admin from './routes/admin.js';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path  from 'path'
import session from 'express-session';
import flash from 'express-flash';
import postagens from './models/posts.js'
import categorias from './models/Categoria.js'
import usuarios from './routes/usuario.js'
import passport from 'passport'
import configPassport from './config/auth.js'
configPassport(passport);
dotenv.config();

const app = Express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize())
app.use(passport.session())

app.use(flash())

app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg")
    res.locals.error_msg = req.flash("error_msg")
    res.locals.error = req.flash("error")
    res.locals.user = req.user || null;
    next()
});
app.engine('handlebars', exphbs.engine({
    defaultLayout: 'main',
    runtimeOptions: 
        {
            allowProtoPropertiesByDefault: true,
            allowProtoMethodsByDefault: true,
        },
}));
app.set('view engine', 'handlebars');
app.use(Express.urlencoded({extended: false}))
app.use(Express.json())
app.use(Express.static(path.join(__dirname, "public")));
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("MongoBD conectado")
}).catch((err) => {
    console.log("erro ao conectar com o MongoBD" + err)
})


app.get('/', (req, res) => {
    postagens.find()
    .populate("categoria")
    .sort({data: "desc"})
    .then((postagens) => {
        res.render('index', {postagens: postagens})
    })
    .catch((err) => {
        req.flash("error_msg", "Houve um erro interno");
        res.redirect("/404")
    })

})
app.get('/postagem/:slug', (req, res) => {
    postagens.findOne({slug: req.params.slug})
    .then((postagem) => {
        if(postagem) {
            res.render("postagem/index", {postagem: postagem})
        }
        else {
            req.flash("error_msg", "Esta postagem não existe!")
            res.redirect("/")
        }
    })
    .catch((err) => {
        req.flash("error_msg", "Houve um erro interno")
        res.redirect("/")
    })
})
app.get('/404', (req,res) => {
    res.send('Erro 404')
})

app.get('/categorias', (req,res) => {
    categorias.find()
    .then((categorias) => {
        res.render("categorias/index", {categorias: categorias})
    })
    .catch((err) => {
        req.flash("error_msg", "Houve um erro interno ao Listar as categorias")
        res.redirect("/")
    })
})
app.get('/categorias/:slug', (req, res) => {
    categorias.findOne({slug: req.params.slug})
    .then((categorias) => {
        if(categorias) {
            postagens.find({categoria: categorias._id})
            .then((postagens) => {
                res.render("categorias/postagens", {postagens: postagens, categoria: categorias})
            })
            .catch((err) => {
                req.flash("error_msg", "Houve um erro ao listar as postagens");
                res.redirect("/")
            })
        }
        else {
            req.flash("error_msg", "Esta categoria não existe");
            res.redirect("/")
        }
    })
    .catch((err) => {
        req.flash("error_msg", "Houve um erro interno ao carregar a pagina desta categoria")
        res.redirect("/")
    })
})
app.use('/admin', admin)
app.use('/usuarios', usuarios)

app.listen(3000, () => {
    console.log("Servidor Rodando")
})