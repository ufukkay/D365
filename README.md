# Smart File Manager (D365)

**Smart File Manager**, yerel dosya sisteminizi tarayan, web tabanlı modern bir arayüz üzerinden dosyalarınızı hızlıca bulmanızı, etiketlemenizi ve yönetmenizi sağlayan bir araçtır.

## 🚀 Özellikler

*   **Hızlı Dosya Tarama:** Belirlenen dizinleri tarayarak veritabanına indeksler.
*   **Gelişmiş Arama & Filtreleme:** Dosyaları isme, türe veya etikete göre anında bulun.
*   **Metadata & Etiketleme:** Dosyalarınıza özel etiketler (tags) ve önem derecesi (importance) atayın.
*   **Sistem Entegrasyonu:** Dosyaları doğrudan tarayıcı üzerinden, işletim sistemindeki varsayılan uygulamasıyla açın.
*   **Modern Arayüz:** React, Vite ve TailwindCSS ile geliştirilmiş hızlı ve şık kullanıcı deneyimi.
*   **Veritabanı Desteği:** SQLite tabanlı esnek ve hafif veri saklama.

## 🛠️ Kurulum ve Kullanım

Projeyi çalıştırmak için hem **Server** hem de **Client** tarafını ayağa kaldırmanız gerekir.

### Gereksinimler
*   Node.js (v14 veya üzeri)
*   NPM veya Yarn

### 1. Sunucuyu (Server) Başlatma
Arka uç (Backend), dosya sistemi işlemleri ve veritabanı yönetimi için çalışır.

```bash
cd server
npm install
node server.js
# Sunucu http://localhost:3001 adresinde çalışacaktır.
```

### 2. İstemciyi (Client) Başlatma
Ön yüz (Frontend), kullanıcı arayüzünü sağlar.

```bash
cd client
npm install
npm run dev
# Tarayıcıda http://localhost:5173 (veya terminalde belirtilen port) adresine gidin.
```

## 🏗️ Proje Yapısı

*   `/server`: Express.js tabanlı API sunucusu ve SQLite veritabanı.
*   `/client`: React ve TailwindCSS tabanlı kullanıcı arayüzü.
*   `files.db`: Dosya indekslerinin tutulduğu SQLite veritabanı.

## 📝 Lisans
Bu proje açık kaynaklıdır ve geliştirilmeye açıktır.
