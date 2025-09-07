const express = require('express');
const { prisma } = require('../utils/prisma');
const { success } = require('../utils/response');
const { authRequired, allowRoles } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async');

const router = express.Router();

router.post('/start', authRequired, async (req, res, next) => {
  try {
    const { subject } = req.body;
    const chat = await prisma.chat.create({ data: { userId: req.user.id, subject: subject || null } });
    return success(res, chat, 'Chat started', 201);
  } catch (e) { next(e); }
});

router.post('/:chatId/messages', authRequired, async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;
    const msg = await prisma.chatMessage.create({ data: { chatId, senderType: 'USER', senderUserId: req.user.id, message } });
    return success(res, msg, 'Message sent', 201);
  } catch (e) { next(e); }
});

router.get('/:chatId/messages', authRequired, async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const msgs = await prisma.chatMessage.findMany({ where: { chatId }, orderBy: { createdAt: 'asc' } });
    return success(res, msgs);
  } catch (e) { next(e); }
});

router.get('/', authRequired, asyncHandler(async (req, res) => {
  const chats = await prisma.chat.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
  return success(res, chats);
}));

router.post('/:chatId/close', authRequired, allowRoles('ADMIN','VENDOR'), asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const ch = await prisma.chat.update({ where: { id: chatId }, data: { isActive: false } });
  return success(res, ch, 'Chat closed');
}));

module.exports = router;
