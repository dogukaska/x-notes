# x-notes

Metin ve görseller için tarayıcıda çalışan kişisel bir not defteri. Notlar, yanıtlar, kategoriler ve profil görselleri IndexedDB'de saklanır. Farklı tarayıcı profilleri ve cihazlar kendi kayıtlarını tutar. Tarayıcıdan site verileri silindiğinde kayıtlar da silinir.

Her kategori kendi profilidir. Not oluştururken veya düzenlerken bir kimlik seçilebilir. Farklı profillerin not ve yanıtları tek bir konuşmada durabilir. Ana profilin takip listeleri kategori profillerini gösterir.

## Geliştirme

```sh
python3 -m http.server 8000 --directory docs
```

Tarayıcıda `http://localhost:8000/` adresini aç. Harici bağımlılık ve derleme adımı yoktur.

## Yayın

GitHub Pages kaynağı `master` dalındaki `/docs` dizinidir. Site adresi https://dogukaska.github.io/x-notes/.
