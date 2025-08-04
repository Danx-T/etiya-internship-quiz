# Quiz Uygulaması

Modern bir quiz uygulaması. NestJS backend ve vanilla JavaScript frontend ile geliştirilmiştir.

## Özellikler

- ✅ Kullanıcı kayıt ve giriş sistemi
- ✅ JWT tabanlı kimlik doğrulama
- ✅ Quiz oluşturma ve yönetimi
- ✅ Zamanlı quiz çözme (soru başına 20 saniye)
- ✅ Sonuç kaydetme ve görüntüleme
- ✅ Liderlik tablosu
- ✅ Şifre değiştirme
- ✅ Responsive tasarım
- ✅ Chart.js entegrasyonu

## Tech Stack

### Backend
- **NestJS** - Node.js framework
- **TypeORM** - ORM
- **MySQL** - Veritabanı
- **JWT** - Kimlik doğrulama
- **bcryptjs** - Şifre hashleme

### Frontend
- **Vanilla JavaScript** - ES6+
- **HTML5** - Semantic markup
- **CSS3** - Modern styling
- **Chart.js** - Grafik kütüphanesi

## Kurulum

### Gereksinimler
- Node.js (v16+)
- MySQL (v8+)
- npm veya yarn

### 1. Projeyi klonlayın
```bash
git clone <repo-url>
cd quiz-project
```

### 2. Bağımlılıkları yükleyin
```bash
npm install
```

### 3. Veritabanını ayarlayın
MySQL'de `quiz_app` adında bir veritabanı oluşturun.

### 4. Environment dosyasını oluşturun
```bash
cp env.example .env
```

`.env` dosyasını düzenleyerek veritabanı bilgilerinizi girin:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your-password
DB_DATABASE=quiz_app
JWT_SECRET=your-super-secret-jwt-key
```

### 5. Uygulamayı başlatın
```bash
# Development modunda
npm run start:dev

# Production modunda
npm run build
npm run start:prod
```

Backend `http://localhost:3001` adresinde çalışacaktır.

### 6. Frontend'i çalıştırın
Basit bir HTTP sunucusu kullanarak frontend'i çalıştırabilirsiniz:

```bash
# Python ile
python -m http.server 3000

# Node.js ile
npx http-server public -p 3000
```

Frontend `http://localhost:3000` adresinde çalışacaktır.

## API Endpoints

### Auth
- `POST /auth/register` - Kullanıcı kaydı
- `POST /auth/login` - Kullanıcı girişi
- `POST /auth/change-password` - Şifre değiştirme
- `GET /auth/profile` - Kullanıcı profili

### Quiz
- `GET /quiz` - Tüm quizleri listele
- `GET /quiz/:id` - Quiz detaylarını getir
- `POST /quiz` - Yeni quiz oluştur
- `POST /quiz/submit` - Quiz sonucunu gönder

### Results
- `GET /results/my-results` - Kullanıcının sonuçları
- `GET /results/leaderboard` - Liderlik tablosu

## Kullanım

1. **Kayıt/Giriş**: İlk olarak bir hesap oluşturun veya mevcut hesabınızla giriş yapın.

2. **Quiz Seçimi**: Ana sayfada mevcut quizleri görüntüleyin ve birini seçin.

3. **Quiz Çözme**: 
   - Her soru için 20 saniye süreniz var
   - Sorular arasında geçiş yapabilirsiniz
   - Süre dolduğunda quiz otomatik olarak tamamlanır

4. **Sonuçları Görüntüleme**: 
   - "Sonuçlarım" sekmesinde geçmiş sonuçlarınızı görebilirsiniz
   - "Liderlik Tablosu" sekmesinde en iyi skorları görebilirsiniz

5. **Profil Yönetimi**: 
   - "Profil" sekmesinde bilgilerinizi görüntüleyebilir
   - Şifrenizi değiştirebilirsiniz

## Veritabanı Şeması

### Users
- `id` - Primary key
- `username` - Kullanıcı adı (unique)
- `email` - Email (unique)
- `password` - Hashlenmiş şifre
- `isAdmin` - Admin yetkisi
- `createdAt` - Oluşturulma tarihi
- `updatedAt` - Güncellenme tarihi

### Quizzes
- `id` - Primary key
- `title` - Quiz başlığı
- `description` - Quiz açıklaması
- `timePerQuestion` - Soru başına süre (saniye)
- `isActive` - Aktif durumu
- `createdAt` - Oluşturulma tarihi
- `updatedAt` - Güncellenme tarihi

### Questions
- `id` - Primary key
- `questionText` - Soru metni
- `options` - Seçenekler (JSON array)
- `correctAnswer` - Doğru cevap indexi
- `quizId` - Quiz foreign key

### Results
- `id` - Primary key
- `userId` - Kullanıcı foreign key
- `quizId` - Quiz foreign key
- `score` - Doğru cevap sayısı
- `totalQuestions` - Toplam soru sayısı
- `timeSpent` - Geçen süre (saniye)
- `answers` - Kullanıcının cevapları (JSON array)
- `createdAt` - Oluşturulma tarihi

## Geliştirme

### Yeni Quiz Ekleme
Admin kullanıcı olarak `/quiz` endpoint'ine POST isteği göndererek yeni quiz ekleyebilirsiniz:

```json
{
  "title": "Genel Kültür Quiz",
  "description": "Genel kültür soruları",
  "timePerQuestion": 20,
  "questions": [
    {
      "questionText": "Türkiye'nin başkenti neresidir?",
      "options": ["İstanbul", "Ankara", "İzmir", "Bursa"],
      "correctAnswer": 1
    }
  ]
}
```

### Özelleştirme
- CSS dosyasını düzenleyerek tasarımı değiştirebilirsiniz
- `app.js` dosyasında frontend mantığını özelleştirebilirsiniz
- Backend servislerini genişletebilirsiniz

## Lisans

MIT License

## Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun 