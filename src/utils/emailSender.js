const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_SENDER,        // 발신자 계정
    pass: process.env.EMAIL_PASSWORD       // 앱 비밀번호
  }
});

exports.sendShareInvitation = async ({ toEmail, shareId }) => {
  const link = `${process.env.BASE_URL}/trip/share/invite/${shareId}`;
  const mailOptions = {
    from: `"여행 일정 공유" <${process.env.EMAIL_SENDER}>`,
    to: toEmail,
    subject: "여행 일정 초대 링크입니다",
    html: `
      <p>안녕하세요, 여행 일정 공유 요청이 도착했습니다.</p>
      <p><a href="${link}">[여기 클릭하여 일정 수락]</a></p>
      <p>감사합니다.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};