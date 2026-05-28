const User = require('../models/user.model');
const { hashPassword } = require('../helpers/password.helper');

const DEFAULT_USERS = [
  {
    name: 'Administrador KitchenFlow',
    email: 'admin@kitchenflow.local',
    password: 'Admin123!',
    role: 'ADMIN',
  },
  {
    name: 'Equipo de Cocina',
    email: 'cocina@kitchenflow.local',
    password: 'Cocina123!',
    role: 'KITCHEN',
  },
  {
    name: 'Punto de Venta',
    email: 'piso@kitchenflow.local',
    password: 'Piso123!',
    role: 'FLOOR',
  },
];

let seedPromise = null;

const ensureDefaultUsers = async () => {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = (async () => {
    for (const entry of DEFAULT_USERS) {
      const existing = await User.findOne({ email: entry.email.toLowerCase() });
      if (existing) {
        if (!existing.active) {
          existing.active = true;
          await existing.save();
        }
        continue;
      }

      const passwordHash = await hashPassword(entry.password);
      await User.create({
        name: entry.name,
        email: entry.email.toLowerCase(),
        passwordHash,
        role: entry.role,
        active: true,
      });
    }
  })()
    .catch((error) => {
      console.log('Error ensuring default users:');
      console.log(error);
    })
    .finally(() => {
      seedPromise = null;
    });

  return seedPromise;
};

module.exports = ensureDefaultUsers;
