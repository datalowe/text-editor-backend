var db = connect("mongodb://dockerAdminUser:dockerAdminPass@localhost:27017/admin");

db = db.getSiblingDB('textEdDb'); // we can not use "use" statement here to switch db

db.createUser(
    {
        user: "dockerUser",
        pwd: "dockerPass",
        roles: [ { role: "readWrite", db: "textEdDb"} ],
        passwordDigestor: "server",
    }
)
