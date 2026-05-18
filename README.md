
# FINSIGHT-AI: AI-Powered Personal Finance Assistant

FINSIGHT-AI, kullanıcıların harcama alışkanlıklarını, harcama sıklıklarını ve bütçe limitlerini analiz ederek dinamik finansal sağlık skorları üreten ve yapay zeka destekli aksiyon planları sunan bir kişisel finans yönetim platformudur.

## Projenin Amacı ve Çözdüğü Problem

Geleneksel finans uygulamaları, verileri yalnızca statik grafikler ve tablolar halinde sunarak kullanıcıya proaktif bir içgörü sağlamakta yetersiz kalmaktadır. FINSIGHT-AI, kullanıcının harcama davranışlarını arka planda analiz ederek bir "FinScore" (Finansal Sağlık Skoru) hesaplar. Bütçe limitleri yaklaştıkça veya dürtüsel harcama oranları arttıkça bu skor dinamik olarak güncellenir ve kullanıcıya risk durumunu görsel olarak bildirir. Sistem, entegre LLM katmanı sayesinde kullanıcıyı uzun metinlerle boğmadan, bütçe durumuna göre doğrudan uygulanabilir ve net tasarruf önerileri üretir.

## Kullanılan Teknolojiler (Tech Stack)

### Frontend (Ön Yüz)

* **Framework:** Next.js (App Router)
* **Styling & UI:** Tailwind CSS, Shadcn UI, Radix UI
* **Data Visualization:** Recharts (Kategori bazlı pasta grafikleri ve kümülatif harcama psikolojisi takibi için özelleştirilmiş şeffaf degrade çizgi grafikleri)

### Backend & AI (Arka Yüz ve Yapay Zeka)

* **Framework:** FastAPI (Python)
* **AI Core:** Google Gemini 2.5 Flash API (Kısa, maddelenmiş ve doğrulanmış finansal tavsiyeler üretmek üzere optimize edilmiş prompt mimarisi)
* **Database & Auth:** Supabase (PostgreSQL)

### Güvenlik ve Mimari Fallback

* **Data Fallback:** API kota sınırları veya bağlantı kesintilerinde UI kilitlenmelerini önlemek amacıyla yedekli mock-data senkronizasyonu kurulmuştur.
* **Siber Güvenlik:** API anahtarları, veritabanı kimlik bilgileri ve çevre değişkenleri `.env` dosyası içerisinde izole edilmiş, `.gitignore` konfigürasyonları sayesinde repoya sızması kesin olarak engellenmiştir.

---

## Kurulum ve Çalıştırma Talimatları

### 1. Ön Yüz (Frontend) Kurulumu

```bash
cd frontend
npm install
npm run dev

```

Uygulama lokalde `http://localhost:3000` adresinde çalışacaktır.

### 2. Arka Yüz (Backend) Kurulumu

```bash
cd finsight-backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

```

### 3. Çevre Değişkenleri (.env) Şablonu

Geliştirme ortamında projenin çalışabilmesi için backend dizininde bir `.env` dosyası oluşturulmalı ve aşağıdaki değişkenler tanımlanmalıdır:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here

*Bu proje Hackathon '26 kapsamında geliştirilmiştir.*