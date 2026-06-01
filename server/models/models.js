const { DataTypes, Sequelize } = require('sequelize'); // Імпортуємо DataTypes
const sequelize = require('../db'); // Імпортуємо ваш екземпляр sequelize

const Users = sequelize.define('Users', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  passwordUpdate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.fn('NOW'),
  },
});

const Email = sequelize.define('Email', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, allowNull: false },
  accessKey: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('disposable', 'reusable') },
  timeDelete: { type: DataTypes.DATE, allowNull: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  isForwardingEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  note: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
});

const Letter = sequelize.define('Letter', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  message: { type: DataTypes.TEXT, allowNull: false },
  subject: { type: DataTypes.STRING, allowNull: false },
  from: { type: DataTypes.STRING, allowNull: false },
  emailId: { type: DataTypes.INTEGER, allowNull: false },
});

const Attachment = sequelize.define('Attachment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fileName: { type: DataTypes.STRING, allowNull: false },
  filePath: { type: DataTypes.STRING, allowNull: false },
  size: { type: DataTypes.INTEGER, allowNull: false },
  letterId: { type: DataTypes.INTEGER, allowNull: false },
});

Email.hasMany(Letter, { foreignKey: 'emailId' });
Letter.belongsTo(Email, { foreignKey: 'emailId' });

Users.hasMany(Email, { foreignKey: 'userId' });
Email.belongsTo(Users, { foreignKey: 'userId' });

Letter.hasMany(Attachment, { foreignKey: 'letterId' });
Attachment.belongsTo(Letter, { foreignKey: 'letterId' });

module.exports = {
  Users,
  Email,
  Letter,
};
