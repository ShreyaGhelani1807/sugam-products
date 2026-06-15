const prisma = require('../lib/prisma');
const { validationResult } = require('express-validator');
const { sendEmail, escapeHtml } = require('../utils/email');
const { recordNotification } = require('../utils/notifications');

exports.submit = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { customerName, email, phone, productId, quantity, address } = req.body;
  try {
    const sample = await prisma.sampleRequest.create({
      data: { customerName, email, phone, productId, quantity: parseInt(quantity), address },
      include: { product: true },
    });

    // Notify admin via email (all user-supplied fields escaped)
    await sendEmail({
      to: process.env.GMAIL_USER || 'admin@sugamproducts.com',
      subject: `New Sample Request — ${customerName}`,
      html: `<p><strong>${escapeHtml(customerName)}</strong> (${escapeHtml(email)}) requested a sample of <strong>${escapeHtml(sample.product?.name)}</strong> (${escapeHtml(quantity)} kg) to ${escapeHtml(address?.city)}, ${escapeHtml(address?.state)}.</p>`,
    });

    res.status(201).json({ message: 'Sample request submitted', sample });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit sample request' });
  }
};

exports.submitContact = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { name, email, phone, subject, message } = req.body;
  try {
    await sendEmail({
      to: process.env.GMAIL_USER || 'admin@sugamproducts.com',
      subject: `Contact Form: ${subject || 'New inquiry'} — ${name}`,
      html: `
        <p><strong>${escapeHtml(name)}</strong> (${escapeHtml(email)}${phone ? `, ${escapeHtml(phone)}` : ''}) sent a message:</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject || '(none)')}</p>
        <p>${escapeHtml(message || '')}</p>
      `,
    });

    // Record an audit notification against an admin recipient (if one exists)
    const admin = await prisma.user.findFirst({ where: { role: 'admin' }, orderBy: { createdAt: 'asc' } });
    await recordNotification({
      userId: admin?.id,
      channel: 'email',
      message: `Contact form from ${name} (${email}): ${subject || 'New inquiry'}`,
    });

    res.status(201).json({ message: 'Message sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};
