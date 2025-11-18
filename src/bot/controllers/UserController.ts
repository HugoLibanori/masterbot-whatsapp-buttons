import Sequelize, { Op } from 'sequelize';

import Users from '../../database/models/User.js';
import { User } from '../../interfaces/index.js';
import Bot from '../../database/models/Bot.js';
import { resetCooldown } from '../../utils/cooldownUtils.js';

export const registerUser = async (sender: string, senderLid: string, pushName: string) => {
  const user: User = {
    id_usuario: sender,
    id_lid: senderLid,
    nome: pushName,
    comandos_total: 0,
    comandos_dia: 0,
    tipo: 'comum',
    advertencia: 0,
    pack: null,
    autor: null,
    expira_em: null,
    plano_ativo: false,
  };
  return await Users.create(user);
};

export const getUser = async (id: string) => {
  const user = await Users.findOne({
    where: {
      [Op.or]: [{ id_usuario: id }, { id_lid: id }],
    },
  });

  return user?.get({ plain: true });
};

export const getUserLid = async (id_usuario: string): Promise<string | null> => {
  const user = await Users.findOne({
    where: {
      [Op.or]: [{ id_usuario: id_usuario }, { id_lid: id_usuario }],
    },
  });
  return user ? user.get({ plain: true }).id_lid : null;
};

export const getOwner = async (): Promise<string> => {
  const owner = await Users.findOne({ where: { tipo: 'dono' } });
  return owner ? owner.get({ plain: true }).id_usuario : 'Sem dono';
};

export const getPack = async (id_usuario: string): Promise<string | null> => {
  const pack = await Users.findOne({ where: { id_usuario } });
  return pack ? pack.get({ plain: true }).pack : null;
};

export const updateLid = async (id_usuario: string, id_lid: string): Promise<string | null> => {
  const user = await Users.findOne({
    where: {
      [Op.or]: [{ id_usuario: id_usuario }, { id_lid: id_usuario }],
    },
  });
  if (!user) return null;
  await user.update({ id_lid });
  return user.get({ plain: true }).id_lid;
};

export const updatePack = async (id_usuario: string, texto: string): Promise<string | null> => {
  const pack = await Users.findOne({ where: { id_usuario } });
  if (!pack) return null;
  await pack.update({ pack: texto });
  return pack.get({ plain: true }).pack;
};

export const getAuthor = async (id_usuario: string): Promise<string | null> => {
  const author = await Users.findOne({ where: { id_usuario } });
  return author ? author.get({ plain: true }).autor : null;
};

export const updateAuthor = async (id_usuario: string, texto: string): Promise<string | null> => {
  const autor = await Users.findOne({ where: { id_usuario } });
  if (!autor) return null;
  await autor.update({ autor: texto });
  return autor.get({ plain: true }).autor;
};

export const changeWarning = async (id_usuario: string, advertencia: number) => {
  const user = await Users.findOne({ where: { id_usuario } });
  if (!user) return;
  await Users.update({ advertencia: user.advertencia + advertencia }, { where: { id_usuario } });
};

export const getUserWarning = async (id_usuario: string): Promise<number> => {
  const advertencia = await Users.findOne({ where: { id_usuario } });
  return advertencia ? advertencia.get({ plain: true }).advertencia : 0;
};

export const resetWarn = async (id_usuario: string) => {
  await Users.update({ advertencia: 0 }, { where: { id_usuario } });
};

export const resetOwner = async () => {
  await Users.update({ tipo: 'comum' }, { where: { tipo: 'dono' } });
};

export const updateOwner = async (id_usuario: string) => {
  await Users.update({ tipo: 'dono' }, { where: { id_usuario } });
};

export const registerOwner = async (id_usuario: string) => {
  await resetOwner();
  await updateOwner(id_usuario);
};

export const cleanType = async (tipo: string, botInfo: Partial<Bot>) => {
  let { limite_diario } = botInfo;
  if (
    !limite_diario?.limite_tipos[tipo as keyof typeof limite_diario.limite_tipos] ||
    tipo === 'comum' ||
    tipo === 'dono'
  )
    return false;
  await Users.update({ tipo: 'comum' }, { where: { tipo } });
  return true;
};

export const getUsersType = async (tipo: string): Promise<Users[]> => {
  return await Users.findAll({ where: { tipo } });
};

export const changeUserType = async (id_usuario: string, tipo: string) => {
  await Users.update({ tipo }, { where: { id_usuario } });

  resetCooldown(id_usuario);
};

export const setUserPlan = async (id_usuario: string, tipo: 'premium' | 'vip', dias: number) => {
  if (isNaN(dias) || dias < 0) {
    throw new Error('O valor de dias é inválido.');
  }

  let expiraEm = null;

  if (dias > 0) {
    expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + dias);
  }

  await Users.update(
    {
      tipo,
      plano_ativo: true,
      expira_em: expiraEm, // <= se dias = 0 vem null
    },
    { where: { id_usuario } },
  );

  resetCooldown(id_usuario);

  return expiraEm;
};

export const checkUserExpiration = async (id_usuario: string) => {
  const user = await Users.findByPk(id_usuario);
  if (!user || !user.expira_em) return false;

  const agora = new Date();
  if (user.expira_em <= agora && user.plano_ativo) {
    await Users.update(
      { tipo: 'comum', plano_ativo: false, expira_em: null },
      { where: { id_usuario } },
    );
    return true;
  }

  return false;
};

export const checkAllExpirations = async () => {
  const agora = new Date();
  const expirados = await Users.findAll({
    where: {
      plano_ativo: true,
      expira_em: { [Op.lte]: agora },
    },
  });

  for (const user of expirados) {
    await Users.update(
      { tipo: 'comum', plano_ativo: false, expira_em: null },
      { where: { id_usuario: user.id_usuario } },
    );
  }

  return expirados.length;
};

export const alterarTipoUsuario = async (
  id_usuario: string,
  tipo: string,
  botInfo: Partial<Bot>,
) => {
  let { limite_diario } = botInfo;
  if (!limite_diario) return false;
  if (
    limite_diario.limite_tipos[tipo as keyof typeof limite_diario.limite_tipos] &&
    tipo !== 'dono'
  ) {
    await changeUserType(id_usuario, tipo);
    return true;
  }
  return false;
};

export const resetCommandsDay = async () => {
  await Users.update({ comandos_dia: 0 }, { where: {} });
};

export const resetUserDayCommands = async (id_usuario: string) => {
  await Users.update({ comandos_dia: 0 }, { where: { id_usuario } });
};

export const limparComandos = async (qtd = 0) => {
  await Users.update({ comandos_total: qtd, comandos_dia: qtd }, { where: {} });
  return true;
};

export const updateName = async (id_usuario: string, nome: string) => {
  await Users.update({ nome }, { where: { id_usuario } });
};

export const verificarUltrapassouLimiteComandos = async (
  id_usuario: string,
  botInfo: Partial<Bot>,
) => {
  let usuario = await getUser(id_usuario);
  if (!usuario) return false;

  if (botInfo?.limite_diario?.limite_tipos) {
    const tipo = usuario.tipo as keyof typeof botInfo.limite_diario.limite_tipos;
    const maxComandos = botInfo.limite_diario.limite_tipos[tipo]?.comandos || 0;
    if (!maxComandos) return false;
    return usuario.comandos_dia >= maxComandos;
  }
  return false;
};

export const addContagemDiaria = async (id_usuario: string) => {
  await Users.update(
    {
      comandos_total: Sequelize.literal('comandos_total + 1'),
      comandos_dia: Sequelize.literal('comandos_dia + 1'),
    },
    { where: { id_usuario } },
  );
};

export const addContagemTotal = async (id_usuario: string) => {
  await Users.update(
    { comandos_total: Sequelize.literal('comandos_total + 1') },
    { where: { id_usuario } },
  );
};
