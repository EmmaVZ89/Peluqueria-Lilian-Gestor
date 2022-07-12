const express = require("express");

const app = express();

const path = require("path");

// app.set("puerto", 2022);
var port = process.env.PORT || 8000;

// VISTAS
app.get("/inicio", function (request, response) {
  response.sendFile(path.resolve(__dirname, "principal.html"));
});

app.get("/", function (request, response) {
  response.sendFile(path.resolve(__dirname, "login.html"));
});

//AGREGO FILE SYSTEM
const fs = require("fs");

//AGREGO JSON
app.use(express.json());

//AGREGO JWT
const jwt = require("jsonwebtoken");

//SE ESTABLECE LA CLAVE SECRETA PARA EL TOKEN
app.set("key", "cl@ve_secreta");
app.use(express.urlencoded({ extended: false }));

//AGREGO MULTER
const multer = require("multer");

//AGREGO MIME-TYPES
const mime = require("mime-types");

//AGREGO STORAGE
const storage = multer.diskStorage({
  destination: "public/fotos/",
});
const upload = multer({
  storage: storage,
});

//AGREGO CORS (por default aplica a http://localhost)
const cors = require("cors");

//AGREGO MW
app.use(cors());

//DIRECTORIO DE ARCHIVOS ESTÁTICOS
app.use(express.static("public"));

//AGREGO MYSQL y EXPRESS-MYCONNECTION
const mysql = require("mysql");
const myconn = require("express-myconnection");
const db_options = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "clientes_lilian_bd",
};
app.use(myconn(mysql, db_options, "single"));

//##############################################################################################//
//RUTAS Y MIDDLEWATE PARA EL SERVIDOR DE AUTENTICACIÓN DE USUARIO Y JWT
//##############################################################################################//
const verificar_usuario = express.Router();
const verificar_jwt = express.Router();

verificar_usuario.use((request, response, next) => {
  let usuario = {};
  usuario.nombre = request.body.nombreUsuario;
  usuario.clave = request.body.clave;
  request.getConnection((err, conn) => {
    if (err) throw "Error al conectarse a la base de datos.";
    conn.query(
      "SELECT * FROM usuarios WHERE nombre = ? and clave = ? ",
      [usuario.nombre, usuario.clave],
      (err, rows) => {
        if (err) throw "Error en consulta de base de datos.";
        if (rows.length == 1) {
          response.obj_usuario = rows[0];
          //SE INVOCA AL PRÓXIMO CALLEABLE
          next();
        } else {
          response.status(401).json({
            exito: false,
            mensaje: "Usuario y/o Contraseña incorrectos",
            jwt: null,
          });
        }
      }
    );
  });
});

app.post("/login", verificar_usuario, (request, response, obj) => {
  //SE RECUPERA EL USUARIO DEL OBJETO DE LA RESPUESTA
  const user = response.obj_usuario;
  //SE CREA EL PAYLOAD CON LOS ATRIBUTOS QUE NECESITAMOS
  const payload = {
    usuario: {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      perfil: user.perfil,
    },
    administrador: {
      nombre: "Soledad",
      apellido: "Quiroz",
    },
    app: "Gestor de Clientes",
  };
  //SE FIRMA EL TOKEN CON EL PAYLOAD Y LA CLAVE SECRETA
  const token = jwt.sign(payload, app.get("key"), {
    expiresIn: "520000m",
  });
  response.json({
    exito: true,
    mensaje: "JWT creado!!!",
    jwt: token,
  });
});

verificar_jwt.use((request, response, next) => {
  //SE RECUPERA EL TOKEN DEL ENCABEZADO DE LA PETICIÓN
  console.log(request.body.headers["authorization"]);
  let token = request.headers["x-access-token"] || request.headers["authorization"];
  if (!token) {
    response.status(401).send({
      error: "El JWT es requerido!!!",
    });
    return;
  }
  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length);
  }
  if (token) {
    //SE VERIFICA EL TOKEN CON LA CLAVE SECRETA
    jwt.verify(token, app.get("key"), (error, decoded) => {
      if (error) {
        return response.json({
          exito: false,
          mensaje: "El JWT NO es válido!!!",
        });
      } else {
        //SE AGREGA EL TOKEN AL OBJETO DE LA RESPUESTA
        response.jwt = decoded;
        //SE INVOCA AL PRÓXIMO CALLEABLE
        next();
      }
    });
  }
});

app.get("/login", (request, response) => {
  let obj_respuesta = {
    exito: false,
    mensaje: "El JWT es requerido!!!",
    payload: null,
    status: 403,
  };
  //SE RECUPERA EL TOKEN DEL ENCABEZADO DE LA PETICIÓN
  let token = request.headers["x-access-token"] || request.headers["authorization"];
  if (!token) {
    response.status(obj_respuesta.status).json({
      obj_respuesta,
    });
  }
  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length);
  }
  if (token) {
    //SE VERIFICA EL TOKEN CON LA CLAVE SECRETA
    jwt.verify(token, app.get("key"), (error, decoded) => {
      if (error) {
        obj_respuesta.mensaje = "El JWT NO es válido!!!";
        response.status(obj_respuesta.status).json(obj_respuesta);
      } else {
        obj_respuesta.exito = true;
        obj_respuesta.mensaje = "El JWT es valido";
        obj_respuesta.payload = decoded;
        obj_respuesta.status = 200;
        response.status(obj_respuesta.status).json(obj_respuesta);
      }
    });
  }
});

// CRUD CLIENTES **************************************************************************************
// Agregar cliente
app.post("/agregarCliente", (request, response) => {
  let obj_respuesta = {
    exito: false,
    mensaje: "No se pudo agregar el cliente",
    id_nuevo: null,
    status: 418,
  };

  let cliente_json = {};
  cliente_json.nombre = request.body.nombre;
  cliente_json.apellido = request.body.apellido;
  cliente_json.telefono = request.body.telefono;
  cliente_json.observacion = request.body.observacion;

  request.getConnection((err, conn) => {
    if (err) throw "Error al conectarse a la base de datos.";
    conn.query("INSERT INTO clientes SET ?", [cliente_json], (err, rows) => {
      if (err) {
        console.log(err);
        throw "Error en consulta de base de datos.";
      } else {
        obj_respuesta.id_nuevo = rows.insertId;
        obj_respuesta.exito = true;
        obj_respuesta.mensaje = "Cliente agregado!";
        obj_respuesta.status = 200;
        response.status(obj_respuesta.status).json(obj_respuesta);
      }
    });
  });
});

// Listar clientes
app.get("/listarClientes", (request, response) => {
  let obj_respuesta = {
    exito: false,
    mensaje: "No se encontraron clientes",
    dato: [],
    payload: null,
    status: 424,
  };

  let jwt = response.jwt;

  request.getConnection((err, conn) => {
    if (err) throw "Error al conectarse a la base de datos.";
    conn.query("SELECT * FROM clientes", (err, rows) => {
      if (err) throw "Error en consulta de base de datos.";
      if (rows.length == 0) {
        response.status(200).json(obj_respuesta);
      } else {
        obj_respuesta.exito = true;
        obj_respuesta.mensaje = "Clientes encontrados!";
        obj_respuesta.dato = rows;
        obj_respuesta.payload = jwt;
        obj_respuesta.status = 200;
        response.status(obj_respuesta.status).json(obj_respuesta);
      }
    });
  });
});

// Modificar cliente
app.post("/modificarCliente", (request, response) => {
  let obj_respuesta = {
    exito: false,
    mensaje: "No se pudo modificar el cliente",
    status: 418,
  };

  let cliente_json = {};
  cliente_json.id = request.body.id;
  cliente_json.id_ficha = request.body.id_ficha;
  cliente_json.nombre = request.body.nombre;
  cliente_json.apellido = request.body.apellido;
  cliente_json.telefono = request.body.telefono;
  cliente_json.observacion = request.body.observacion;

  let fichas = request.body.ficha;

  fichas.forEach((item) => {
    request.getConnection((err, conn) => {
      if (err) throw "Error al conectarse a la base de datos.";
      conn.query("UPDATE fichas SET ? WHERE id = ? AND fecha = ?", [item, item.id, item.fecha], (err, rows) => {
        if (err) {
          console.log(err);
          throw "Error en consulta de base de datos.";
        }
      });
    });
  });

  request.getConnection((err, conn) => {
    if (err) throw "Error al conectarse a la base de datos.";
    conn.query("UPDATE clientes SET ? WHERE id = ?", [cliente_json, cliente_json.id], (err, rows) => {
      if (err) {
        console.log(err);
        throw "Error en consulta de base de datos.";
      }
      obj_respuesta.exito = true;
      obj_respuesta.mensaje = "Cliente Modificado!";
      obj_respuesta.status = 200;
      response.status(obj_respuesta.status).json(obj_respuesta);
    });
  });
});

// Eliminar cliente
app.post("/eliminarCliente", (request, response) => {
  let obj_respuesta = {
    exito: false,
    mensaje: "No se pudo eliminar el cliente",
    status: 418,
  };

  let cliente_json = {};
  cliente_json.id = request.body.id;

  request.getConnection((err, conn) => {
    if (err) throw "Error al conectarse a la base de datos.";
    conn.query("DELETE FROM clientes WHERE id = ?", [cliente_json.id], (err, rows) => {
      if (err) {
        console.log(err);
        throw "Error en consulta de base de datos.";
      }
    });
  });

  request.getConnection((err, conn) => {
    if (err) throw "Error al conectarse a la base de datos.";
    conn.query("DELETE FROM fichas WHERE id = ?", [cliente_json.id], (err, rows) => {
      if (err) {
        console.log(err);
        throw "Error en consulta de base de datos.";
      }
      obj_respuesta.exito = true;
      obj_respuesta.mensaje = "Cliente Eliminado!";
      obj_respuesta.status = 200;
      response.status(obj_respuesta.status).json(obj_respuesta);
    });
  });
});

// CRUD FICHAS **************************************************************************************
// Agregar ficha
app.post("/agregarFicha", (request, response) => {
  let obj_respuesta = {
    exito: false,
    mensaje: "No se pudo agregar la ficha",
    status: 418,
  };

  let ficha_json = {};
  ficha_json.id = request.body.id;
  ficha_json.fecha = request.body.fecha;
  ficha_json.detalle = request.body.detalle;

  request.getConnection((err, conn) => {
    if (err) throw "Error al conectarse a la base de datos.";
    conn.query("INSERT INTO fichas set ?", [ficha_json], (err, rows) => {
      if (err) {
        console.log(err);
        throw "Error en consulta de base de datos.";
      }
      obj_respuesta.exito = true;
      obj_respuesta.mensaje = "Ficha agregada!";
      obj_respuesta.status = 200;
      response.status(obj_respuesta.status).json(obj_respuesta);
    });
  });
});

// Listar Fichas
app.get("/listarFichas", (request, response) => {
  let obj_respuesta = {
    exito: false,
    mensaje: "No se encontraron fichas",
    dato: [],
    status: 424,
  };

  request.getConnection((err, conn) => {
    if (err) throw "Error al conectarse a la base de datos.";
    conn.query("SELECT * FROM fichas", (err, rows) => {
      if (err) throw "Error en consulta de base de datos.";
      if (rows.length == 0) {
        response.status(200).json(obj_respuesta);
      } else {
        obj_respuesta.exito = true;
        obj_respuesta.mensaje = "Fichas encontradas!";
        obj_respuesta.dato = rows;
        obj_respuesta.status = 200;
        response.status(obj_respuesta.status).json(obj_respuesta);
      }
    });
  });
});

// Modificar control
app.post("/modificarControl", (request, response) => {
  let obj_respuesta = {
    exito: false,
    mensaje: "No se pudo modificar el control",
    status: 418,
  };

  let control_json = {};
  control_json.id = request.body.id;
  control_json.fecha = request.body.fecha;
  control_json.peso = request.body.peso;
  control_json.pecho = request.body.pecho;
  control_json.cintura = request.body.cintura;
  control_json.ombligo = request.body.ombligo;
  control_json.cadera = request.body.cadera;
  control_json.biceps = request.body.biceps;
  control_json.muslos = request.body.muslos;
  control_json.objetivo = request.body.objetivo;

  request.getConnection((err, conn) => {
    if (err) throw "Error al conectarse a la base de datos.";
    conn.query(
      "UPDATE controles SET ? WHERE id = ? AND fecha = ?",
      [control_json.id, control_json.fecha],
      (err, rows) => {
        if (err) {
          console.log(err);
          throw "Error en consulta de base de datos.";
        }
        obj_respuesta.exito = true;
        obj_respuesta.mensaje = "Control modificado!";
        obj_respuesta.status = 200;
        response.status(obj_respuesta.status).json(obj_respuesta);
      }
    );
  });
});

// Eliminar control
app.post("/eliminarControl", (request, response) => {
  let obj_respuesta = {
    exito: false,
    mensaje: "No se pudo eliminar el control",
    status: 418,
  };

  let control_json = {};
  control_json.id = request.body.id;
  control_json.fecha = request.body.fecha;
  control_json.peso = request.body.peso;
  control_json.pecho = request.body.pecho;
  control_json.cintura = request.body.cintura;
  control_json.ombligo = request.body.ombligo;
  control_json.cadera = request.body.cadera;
  control_json.biceps = request.body.biceps;
  control_json.muslos = request.body.muslos;
  control_json.objetivo = request.body.objetivo;

  request.getConnection((err, conn) => {
    if (err) throw "Error al conectarse a la base de datos.";
    conn.query(
      "DELETE FROM controles WHERE id = ? AND fecha = ?",
      [control_json.id, control_json.fecha],
      (err, rows) => {
        if (err) {
          console.log(err);
          throw "Error en consulta de base de datos.";
        }
        obj_respuesta.exito = true;
        obj_respuesta.mensaje = "Control eliminado!";
        obj_respuesta.status = 200;
        response.status(obj_respuesta.status).json(obj_respuesta);
      }
    );
  });
});

app.listen(port, () => {
  console.log("Servidor corriendo sobre puerto:" + port);
});
