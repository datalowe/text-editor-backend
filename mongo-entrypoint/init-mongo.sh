#!/usr/bin/env bash
mongo <<EOF
use $DB_NAME

db.createUser({
  user: '$DB_USERNAME',
  pwd: '$DB_PASSWORD',
  roles: [{
    role: 'readWrite',
    db: '$DB_NAME'
  }]
})
EOF