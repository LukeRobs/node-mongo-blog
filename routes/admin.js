import { Router } from "express";
import Categorias from "../models/Categoria.js";
import Post from "../models/posts.js";
import eAdmin  from "../helpers/eAdmin.js"
import User from "../models/usuario.js"

const routes = new Router();
const categoria = Categorias ;


routes.get('/', eAdmin.eAdmin, async (req,res) => {
    try {

        const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

        const seteDiasAtras = new Date();
            seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

        const umMesAtras = new Date();
            umMesAtras.setMonth(umMesAtras.getMonth() - 1);

        
        const categoriasHoje = await Categorias.countDocuments({ date: { $gte: hoje } });
        const postsSemana = await Post.countDocuments({ date: { $gte: seteDiasAtras } });
        const usuariosMes = await User.countDocuments({ date: { $gte: umMesAtras } });

        const totalCategorias = await Categorias.countDocuments();
        const totalPostagens = await Post.countDocuments();
        const totalUsuarios = await User.countDocuments();

        

        res.render("admin/dashboard", { usuario: req.session.user, totalCategorias, totalPostagens, totalUsuarios, categoriasHoje, postsSemana, usuariosMes });
        
    } 
    catch(err) {
        console.error(err);
        req.flash("error_msg", "Erro ao carregar dados do dashboard");
        res.redirect("/admin/categorias");
    }
});

routes.get('/categorias', eAdmin.eAdmin, (req, res) => {
    categoria.find().then((categoria) => {
        res.render("admin/categorias", {categorias: categoria})
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao Listar as categorias")
        res.redirect("/admin")
    })
})

routes.get('/categorias/add', eAdmin.eAdmin, (req, res) => {
    res.render("admin/addcategorias")
})
function validaCategorias(req, res, next){
    let erros = []

    if(!req.body.nome || req.body.nome.trim() === '') {
        erros.push({texto: "nome invalido"})
    }
    if(!req.body.slug || req.body.slug.trim() === '') {
        erros.push({texto: "Slug invalido"})
    }
    if(erros.length > 0) {
        res.render("admin/addcategorias", {erros: erros})
    }
    else{
        next();
    }
}
routes.post('/categorias/nova', validaCategorias, eAdmin.eAdmin, (req,res) => {
    const novaCategoria = {
        nome: req.body.nome,
        slug: req.body.slug
    }
    new categoria(novaCategoria).save().then(() => {
        req.flash("success_msg", "categoria criada com sucesso!")
        res.redirect("/admin/categorias")
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao salvar a categoria")
        res.redirect("/admin")
    })
    

})
routes.get('/categorias/edit/:id', eAdmin.eAdmin, (req, res) => {
    categoria.findOne({_id: req.params.id}).then((categoria) => {
        res.render("admin/editcategorias", {categoria: categoria})
    }).catch((err) => {
        req.flash("error_msg", "Esta categoria não existe");
        res.redirect("/admin/categorias")
    })
})
function validaEdit(req, res, next) {
    let error = [];

    if(!req.body.nome || req.body.nome.trim() === '') {
        error.push({texto: "Nome invalido"})
    }
    if(!req.body.slug || req.body.slug.trim() === '') {
        error.push({texto: "Slug invalido"})
    }
    if(error.length > 0) {
        res.render("admin/editcategorias", {error: error})
    }
    else {
        next();
    }
}
routes.post('/categorias/edit', validaEdit, eAdmin.eAdmin, (req, res) => {
    categoria.findOneAndUpdate({_id: req.body.id}).then((categoria) => {
        categoria.nome = req.body.nome
        categoria.slug = req.body.slug

        categoria.save().then(() => {
            req.flash("success_msg", "Categoria editada com sucesso");
            res.redirect("/admin/categorias")
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno ao salvar a edição");
            res.redirect("/admin/categorias")
        })
    })
    .catch((err) => {
        req.flash("error_msg", "Houve um erro ao editar a categoria");
        res.redirect("/admin/categorias");
    }) 
})
routes.post('/categorias/deletar', eAdmin.eAdmin, (req, res) => {
    categoria.deleteOne({_id: req.body.id}).then(() => {
        req.flash("success_msg", "categoria Deletada com sucesso");
        res.redirect("/admin/categorias")
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao deletar a categoria");
        res.redirect("/admin/categorias")
    })
})

routes.get('/postagens', eAdmin.eAdmin, (req,res) => {
    Post.find()
    .populate('categoria')
    .then((Post) => {
        res.render("admin/postagens", {postagens: Post})
    })
    .catch((err) => {
        req.flash("error_msg", "Houve um erro ao Listar as Postagens");
        res.redirect("/admin");
    })
})
routes.get('/postagens/add', eAdmin.eAdmin, (req, res) => {
    categoria.find().then((categorias) => {
        res.render("admin/addpostagem", {categorias: categorias})
    }).catch((err) =>{
        req.flash("error_msg", "Houve um erro ao carregar o formulario");
        res.redirect("/admin")
    })
})
// middleware nova postagem
function validaPostagem(req, res, next) {
        let erros = [];

        if(!req.body.titulo || req.body.titulo.trim() === '') {
            erros.push({texto: "Titulo é obrigatorio."});
        }
        if(!req.body.slug || req.body.slug.trim() === '') {
            erros.push({texto: "Slug é obrigatorio"});
        }
        if(!req.body.descricao || req.body.descricao.trim() === '') {
            erros.push({texto: "descrição é obrigatoria"})
        }
        if(!req.body.conteudo || req.body.conteudo.trim() === '') {
            erros.push({texto: "conteudo é obrigatorio"})
        }
        if(!req.body.categoria || req.body.categoria ==='0') {
            erros.push({texto: "Categoria inválida, registre uma categoria"})
        }
        if (erros.length > 0) {
            categoria.find()
            .lean()
            .then((categorias) => {
                return res.render("admin/addpostagem", { erros: erros, categorias: categorias, dados: req.body });
            })
            .catch((err) => {
                req.flash("error_msg", "Erro ao carregar categorias");
                res.redirect("/admin/postagens");
            });
        }
        else {
            next();
        }
}
routes.post("/postagens/nova", validaPostagem, eAdmin.eAdmin, (req, res) => {
        const novaPostagem = {
            titulo: req.body.titulo,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria,
            slug: req.body.slug
        };

        new Post(novaPostagem)
        .save()
        .then(() => {
            req.flash("success_msg", "Postagem criada com sucesso");
            res.redirect("/admin/postagens")
        })
        .catch((err) =>{
            req.flash("error_msg", "Houve um erro durante o salvamento da postagem")
            res.redirect("/admin/postagens")
        })
})

routes.get('/postagens/edit/:id', eAdmin.eAdmin, (req,res) => {
    Post.findOne({_id: req.params.id})
    .then((Post) => {
        categoria.find()
        .then((categorias) => {
            res.render("admin/editpostagens", {categorias: categorias, postagens: Post});
        })
        .catch((err) => {
            req.flash("error_msg", "Houve um erro ao listar as categorias");
            res.redirect("/admin/postagens");
        })
    })
    .catch((err) => {
        req.flash("error_msg", "Houve um erro ao carregar o formulario de edição");
        res.redirect("/admin/postagens");
    })
})
routes.post('/postagens/edit', eAdmin.eAdmin, (req,res) => {
    Post.findOne({_id: req.body.id})
        .then((Post) => {
        Post.titulo = req.body.titulo
        Post.slug = req.body.slug
        Post.descricao = req.body.descricao
        Post.conteudo = req.body.conteudo
        Post.categoria = req.body.categoria

        Post.save()
        .then(() => {
            req.flash("success_msg", "Postagem salva com sucesso");
            res.redirect("/admin/postagens")
        })
        .catch((err) => {
            req.flash("error_msg", "Erro interno");
            res.redirect("/admin/postagens")
        })
    })
    .catch((err) => {
        req.flash("error_msg", "Houve um erro ao salvar a edição");
        res.redirect("/admin/postagens");
    })
})
routes.post('/postagens/deletar', eAdmin.eAdmin, (req, res) => {
    Post.deleteOne({_id: req.body.id})
    .then(() => {
        req.flash("success_msg", "Postagem Deletada com sucesso");
        res.redirect("/admin/postagens")
    })
    .catch((err) => {
        req.flash("error_msg", "Houve um erro ao deletar a Postagem");
        res.redirect("/admin/postagens")
    })
})

export default routes