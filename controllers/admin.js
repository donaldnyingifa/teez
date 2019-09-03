const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    res.render('admin/edit-product', { 
        pageTitle: 'Add Product', 
        path: '/admin/add-product', 
        editing: false,
        isAuthenticated: req.session.isLoggedIn
     });
 };

 exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const imageurl = req.body.imageurl;
    const price = req.body.price;
    const description = req.body.description;

    req.user
        .createProduct({
            title,
            price,
            imageurl,
            description,
        })
        .then(() => {
            console.log('Created Product')
            res.redirect('/admin/products');
            })
        .catch(err => console.log(err));
    
}

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/'); 
    }
    const prodId = req.params.productId;
    req.user
        .getProducts({where: {id: prodId}})
    //Product.findAll({where: {id: prodId}})
    .then(([product]) => {
        if (!product) {
            return res.redirect('/');
        }
        res.render('admin/edit-product', { 
            pageTitle: 'Edit Product', 
            path: '/admin/edit -product', 
            editing: editMode,
            product: product,
            isAuthenticated: req.session.isLoggedIn,

         });
    }).catch(err => console.log(err));   
 };

 exports.postEditProduct = (req, res, next) => {
     const prodId = req.body.productId;
     const updatedTitle  = req.body.title;
     const updatedPrice  = req.body.price;
     const updatedImageUrl  = req.body.imageurl;
     const updatedDesc  = req.body.description;
     Product.findAll({where: {id: prodId}})
     .then(([product]) => {
         if (product.userId !== req.user.id) {
             return res.redirect('/');
         }
        // console.log('s-----',product)
        product.title = updatedTitle,
        product.imageurl = updatedImageUrl,
        product.price = updatedPrice,
        product.description = updatedDesc 
        return product.save().then(result => {
            // console.log('Updated Product')
             res.redirect('/admin/products');
         })
     })
     .catch(err => console.log(err));
     
 };

exports.getProducts = (req, res, next) => {
    // req.user
    // .getProducts()
    Product.findAll({where: {userId: req.user.id}})
    .then((products) => {
        res.render('admin/products', {
            prods: products,
            pageTitle: 'Admin Products',
            path: '/admin/products',
            isAuthenticated: req.session.isLoggedIn
        });
    })
    .catch(err => console.log(err));

}

exports.postDeleteProduct = (req, res, next) => {
    const productId = req.body.productId;
    Product.findAll({where: {id: productId, userId: req.user.id}})
    .then(([product]) => {
        return product.destroy();
    })
    .then(result => {
        console.log('Product destroyed');
        res.redirect('/admin/products');
    })
    .catch (err => console.log(err));
}