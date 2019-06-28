var express = require('express');
var router = express.Router();
const Usuario = require('../models/Usuario');
const Token   = require('../models/Token');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});



router.post('/registrar', async(req, res, next) => {
  const datosUsuario = req.body;
  let nuevoUsuario = new Usuario();

  //  Verificamos que usuario no exista
  [err, usuario] = await Usuario.ObtenerPorCorreo(datosUsuario.correoElectronico);
  if(err)
  {
    switch(err.tipo)
    {
      case 'U':
        res.statusCode = 400;
        break;
      default : 
        res.statusCode = 500;
        break;
    }
    return res.json({
      error: {
        codigo: err.codigo,
        obetivo: `${req.method} ${req.baseUrl}`,
        cuerpo: req.body,
        ofensa: err.ofensa
      }
    });
  }

  if(usuario)
  {
    res.statusCode = 409;
    return res.json({
      error: {
        codigo: 'U-1000',
        objetivo: `${req.method} ${req.baseUrl}`,
        cuerpo: req.body,
        ofensa: err.ofensa
      }
    });
  }
  
  //  Validacion exitosa.
  //  Cargamos informacion de usuario enviada en peticion
  
  nuevoUsuario.matricula  = datosUsuario.matricula;
  nuevoUsuario.apPaterno  = datosUsuario.apPaterno;
  nuevoUsuario.apMaterno  = datosUsuario.apMaterno;
  nuevoUsuario.nombre     = datosUsuario.nombre;
  nuevoUsuario.rol        = datosUsuario.rol;
  nuevoUsuario.password   = datosUsuario.password;           
  // nuevoUsuario.fotografia = datosUsuario.fotografia;               Aun no se implementa el manejo de archivos
  nuevoUsuario.correoElectronico = datosUsuario.correoElectronico;

  //  Creamos nuevo usuario
  [err, _] = await nuevoUsuario.Crear();
  if(err)
  {
    switch(err.tipo)
    {
      case 'U':
        res.statusCode = 400;
        break;
      default : 
        res.statusCode = 500;
        break;
    }
    return res.json({
      error: {
        codigo: err.codigo,
        obetivo: `${req.method} ${req.baseUrl}`,
        cuerpo: req.body,
        ofensa: err.ofensa
      }
    });
  }

  //  Generamos un token de acceso
  [err, token] = await Token.Generar(nuevoUsuario.id);


  //  Ocultamos datos privados
  nuevoUsuario.id        = undefined;
  nuevoUsuario.password  = undefined;
  // nuevoUsuario.fotografia = undefined;                         Aun no se implementa manejo de archivos

  res.statusCode = 201;
  return res.json({
    usuario: nuevoUsuario,
    token: token
  });
});

router.post('/autorizar', async(req, res, next) => {
  //  Obtenemos los datos de acceso y validamos
  const datosAcceso = req.body;
  const token = req.header('autorization');

  if(!datosAcceso.matricula || !datosAcceso.password || !token)
  {
    res.statusCode = 400;
    return res.json({
      error: {
        codigo: 'U-1000',
        objetivo: `${req.method} ${req.baseUrl}`,
        cuerpo: datosAcceso,
        ofensa: {
          requeridos: {
            matricula: datosAcceso.matricula ? true : false,
            password:  datosAcceso.password  ? true : false
          },
          cabeceras:{
            autorization: token ? true: false
          }
        }
      }
    })
  }

  //  Validacion de peticion correcta. 
  //  Verificamos credenciales 
  [err, usuario] = await Usuario.ObtenerPorMatricula(datosAcceso.matricula);
  if(err)
  {
    switch(err.tipo)
    {
      case 'U':
        res.statusCode = 400;
        break;
      default : 
        res.statusCode = 500;
        break;
    }
    return res.json({
      error: {
        codigo: err.codigo,
        obetivo: `${req.method} ${req.baseUrl}`,
        cuerpo: req.body,
        ofensa: err.ofensa
      }
    });
  }
  if(!usuario)
  {
    res.statusCode = 404;
    return res.json();
  }
  if(!usuario.ValidarPassword(datosAcceso.password))
  {
    res.statusCode = 401;
    return res.json();
  }

  //  Validacion de usuario completa.
  //  Asignamos token de sesion
  console.log(await Token.Verificar(token));
  res.send();
});

module.exports = router;
