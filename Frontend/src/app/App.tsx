import { useState, useRef, useCallback } from "react";
import {
  Upload,
  ArrowLeft,
  RotateCcw,
  Loader2,
  AlertCircle,
  ArrowRight,
  X,
  Eye,
  Ear,
  BookOpen,
  Zap,
  Home,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Page = "home" | "upload" | "result";
type UploadState = "empty" | "selected" | "loading" | "error";

interface PredictionResult {
  predicted_class: "A" | "K" | "R" | "V";
  predicted_label: string;
  confidence: number;
  probabilities: {
    A: number;
    K: number;
    R: number;
    V: number;
  };
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const VARK_STYLES = [
  {
    key: "V",
    name: "Visual",
    nameId: "Visual",
    desc: "Belajar efektif melalui grafik, diagram, peta pikiran, dan representasi visual lainnya.",
    icon: Eye,
    border: "border-l-sky-400",
    letter: "text-sky-500",
    dot: "bg-sky-400",
  },
  {
    key: "A",
    name: "Auditory",
    nameId: "Auditorial",
    desc: "Belajar efektif melalui diskusi kelompok, ceramah, dan pemaparan materi secara lisan.",
    icon: Ear,
    border: "border-l-emerald-400",
    letter: "text-emerald-500",
    dot: "bg-emerald-400",
  },
  {
    key: "R",
    name: "Read/Write",
    nameId: "Baca / Tulis",
    desc: "Belajar efektif melalui membaca teks, membuat rangkuman, dan pencatatan tertulis.",
    icon: BookOpen,
    border: "border-l-amber-400",
    letter: "text-amber-500",
    dot: "bg-amber-400",
  },
  {
    key: "K",
    name: "Kinesthetic",
    nameId: "Kinestetik",
    desc: "Belajar efektif melalui pengalaman langsung, demonstrasi, dan praktik nyata.",
    icon: Zap,
    border: "border-l-violet-400",
    letter: "text-violet-500",
    dot: "bg-violet-400",
  },
];

// ─── Shared: Header ────────────────────────────────────────────────────────────

function Header({
  onNavigate,
  rightSlot,
}: {
  onNavigate: (p: Page) => void;
  rightSlot?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-3 group"
        >
          {/* Maroon monogram */}
          <div className="w-7 h-7 bg-primary rounded-sm flex items-center justify-center flex-shrink-0">
            <span className="font-serif text-xs font-bold text-primary-foreground leading-none">
              VP
            </span>
          </div>
          <span className="font-serif text-[15px] font-semibold text-foreground tracking-tight leading-none">
            VARK Palmprint
          </span>
        </button>
        {rightSlot}
      </div>
    </header>
  );
}

// ─── Shared: Section label ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] font-medium tracking-[0.18em] uppercase text-primary mb-3">
      {children}
    </p>
  );
}

// ─── Shared: Footer ────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30 mt-auto">
      <div className="max-w-6xl mx-auto px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
            <span className="font-serif text-[10px] font-bold text-primary-foreground leading-none">
              VP
            </span>
          </div>
          <span className="text-sm font-medium text-foreground font-serif">
            VARK Palmprint
          </span>
        </div>
        <p className="font-mono text-[11px] text-muted-foreground text-center sm:text-right tracking-wide">
          Prototype UI · Universitas Sebelas Maret · K3522025
        </p>
      </div>
    </footer>
  );
}

// ─── Home Page ─────────────────────────────────────────────────────────────────

function HomePage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        onNavigate={onNavigate}
        rightSlot={
          <nav className="flex items-center gap-6">
            <a
              href="#tentang"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors tracking-wide"
            >
              Tentang
            </a>
            <button
              onClick={() => onNavigate("upload")}
              className="text-xs font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-sm hover:bg-primary/90 transition-colors tracking-wide"
            >
              Mulai Prediksi
            </button>
          </nav>
        }
      />

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-8 pt-20 pb-24 w-full">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left — Editorial text */}
          <div className="lg:col-span-7">
            <SectionLabel>Universitas Sebelas Maret · Prototype Sistem</SectionLabel>

            <h1 className="font-serif text-[72px] font-bold text-foreground leading-[0.95] tracking-tight mb-1">
              VARK
            </h1>
            <h1 className="font-serif text-[72px] font-normal text-foreground/60 leading-[0.95] tracking-tight mb-7">
              Palmprint
            </h1>

            {/* Maroon rule */}
            <div className="flex items-center gap-3 mb-7">
              <div className="w-10 h-[2px] bg-primary rounded-full" />
              <p className="font-serif text-base italic text-muted-foreground">
                Klasifikasi Gaya Belajar Berdasarkan Citra Telapak Tangan
              </p>
            </div>

            <p className="text-[15px] text-muted-foreground leading-relaxed max-w-[440px] mb-10">
              Sistem prototype untuk mengidentifikasi kategori gaya belajar VARK
              berdasarkan citra telapak tangan menggunakan Convolutional Neural
              Network (CNN).
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate("upload")}
                className="inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-7 py-3 rounded-sm text-[13px] font-semibold tracking-wide hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Mulai Prediksi
                <ArrowRight size={14} />
              </button>
              <a
                href="#tentang"
                className="text-[13px] text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Pelajari lebih lanjut
              </a>
            </div>
          </div>

          {/* Right — VARK Typogram */}
          <div className="lg:col-span-5 hidden lg:block">
            <div className="grid grid-cols-2 border border-border rounded-sm overflow-hidden shadow-sm">
              {[
                { letter: "V", opacity: "opacity-100", weight: "font-bold", bg: "bg-card" },
                { letter: "A", opacity: "opacity-30", weight: "font-normal", bg: "bg-secondary/40" },
                { letter: "R", opacity: "opacity-15", weight: "font-medium", bg: "bg-secondary/20" },
                { letter: "K", opacity: "opacity-55", weight: "font-semibold", bg: "bg-card" },
              ].map((item, i) => (
                <div
                  key={item.letter}
                  className={`${item.bg} flex items-center justify-center py-12 px-8
                    ${i % 2 === 0 ? "border-r" : ""} border-border
                    ${i < 2 ? "border-b" : ""} border-border`}
                >
                  <span
                    className={`font-serif text-[90px] leading-none text-primary ${item.weight} ${item.opacity} select-none`}
                  >
                    {item.letter}
                  </span>
                </div>
              ))}
            </div>
            <p className="font-mono text-[10px] text-muted-foreground/50 tracking-widest text-center mt-3 uppercase">
              Visual · Auditory · Read/Write · Kinesthetic
            </p>
          </div>
        </div>
      </section>

      {/* ── Thin rule ── */}
      <div className="max-w-6xl mx-auto px-8 w-full">
        <div className="border-t border-border" />
      </div>

      {/* ── VARK Section ── */}
      <section className="max-w-6xl mx-auto px-8 py-20 w-full">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-3">
            <SectionLabel>Model VARK</SectionLabel>
            <h2 className="font-serif text-2xl font-semibold text-foreground leading-snug mb-3">
              Empat Kategori Gaya Belajar
            </h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Sistem mengklasifikasikan citra telapak tangan ke salah satu
              kategori berikut menggunakan model CNN.
            </p>
          </div>

          <div className="lg:col-span-9 grid sm:grid-cols-2 gap-4">
            {VARK_STYLES.map((style) => {
              const Icon = style.icon;
              return (
                <div
                  key={style.key}
                  className={`bg-card border border-border border-l-4 ${style.border} rounded-sm p-5 hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 pt-0.5">
                      <span
                        className={`font-serif text-4xl font-bold leading-none ${style.letter}`}
                      >
                        {style.key}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-sm font-semibold text-foreground">
                          {style.name}
                        </p>
                        <span className="font-mono text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded-sm">
                          {style.nameId}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {style.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Thin rule ── */}
      <div className="max-w-6xl mx-auto px-8 w-full">
        <div className="border-t border-border" />
      </div>

      {/* ── About Research ── */}
      <section
        id="tentang"
        className="max-w-6xl mx-auto px-8 py-20 w-full"
      >
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4">
            <SectionLabel>Tentang Penelitian</SectionLabel>
            <h2 className="font-serif text-2xl font-semibold text-foreground leading-snug mb-4">
              Latar Belakang & Tujuan
            </h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Penelitian ini mengembangkan sistem otomatis untuk mengklasifikasikan
              gaya belajar VARK siswa berdasarkan pola citra telapak tangan
              menggunakan pendekatan deep learning berbasis CNN.
            </p>
          </div>

          <div className="lg:col-span-8">
            {/* Research card — styled like a paper citation block */}
            <div className="bg-card border border-border rounded-sm overflow-hidden shadow-sm">
              {/* Top accent */}
              <div className="h-1 bg-primary w-full" />
              <div className="p-7">
                <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-primary mb-5">
                  Informasi Penelitian
                </p>
                <div className="space-y-0 divide-y divide-border">
                  {[
                    {
                      label: "Judul",
                      value: "Klasifikasi Gaya Belajar VARK Siswa Berbasis Citra Telapak Tangan Menggunakan Convolutional Neural Network (CNN)",
                      mono: false,
                    },
                    {
                      label: "Peneliti",
                      value: "Elsya Candra Nihaya Firdaus",
                      mono: false,
                    },
                    { label: "NIM", value: "K3522025", mono: true },
                    {
                      label: "Institusi",
                      value: "Universitas Sebelas Maret",
                      mono: false,
                    },
                    { label: "Lokasi", value: "Surakarta, Indonesia", mono: false },
                  ].map(({ label, value, mono }) => (
                    <div
                      key={label}
                      className="grid grid-cols-4 gap-4 py-3.5 items-baseline"
                    >
                      <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider col-span-1">
                        {label}
                      </p>
                      <p
                        className={`col-span-3 text-[14px] text-foreground leading-relaxed ${
                          mono
                            ? "font-mono text-primary font-medium"
                            : "font-medium"
                        }`}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ─── Upload Page ───────────────────────────────────────────────────────────────

interface UploadPageProps {
  uploadState: UploadState;
  selectedImage: string | null;
  isDragging: boolean;
  errorMessage: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPredict: () => void;
  onReset: () => void;
  onNavigate: (p: Page) => void;
  onOpenFilePicker: () => void;
}

function UploadPage({
  uploadState,
  selectedImage,
  isDragging,
  errorMessage,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onInputChange,
  onPredict,
  onReset,
  onNavigate,
  onOpenFilePicker,
}: UploadPageProps) {
  const isIdle = uploadState === "empty" || uploadState === "error";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        onNavigate={onNavigate}
        rightSlot={
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <Home size={12} />
            Beranda
          </button>
        }
      />

      <div className="max-w-6xl mx-auto px-8 py-14 w-full flex-1">
        {/* Back + heading */}
        <button
          onClick={() => onNavigate("home")}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8 font-medium"
        >
          <ArrowLeft size={12} />
          Kembali ke Beranda
        </button>

        <div className="mb-10">
          <SectionLabel>Langkah 1 dari 2</SectionLabel>
          <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">
            Unggah Citra Telapak Tangan
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
            Unggah satu citra telapak tangan yang jelas, terbuka penuh, fokus,
            dan tanpa aksesori.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Upload area */}
          <div className="lg:col-span-8">
            <div className="bg-card border border-border rounded-sm shadow-sm overflow-hidden">
              {/* Loading */}
              {uploadState === "loading" && (
                <div className="py-20 flex flex-col items-center justify-center gap-6">
                  {selectedImage && (
                    <div className="relative">
                      <div className="w-24 h-24 rounded-sm overflow-hidden border border-border">
                        <img
                          src={selectedImage}
                          alt="Preview"
                          className="w-full h-full object-cover opacity-30"
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 size={28} className="text-primary animate-spin" />
                      </div>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="font-serif text-lg font-medium text-foreground mb-1">
                      Memproses Citra
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Mengirim citra ke model CNN untuk diklasifikasikan…
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-primary/30 animate-pulse"
                        style={{ animationDelay: `${i * 180}ms` }}
                      />
                    ))}
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
                    Menunggu respons backend · API /predict
                  </p>
                </div>
              )}

              {/* Empty */}
              {uploadState === "empty" && (
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={onOpenFilePicker}
                  className={`m-5 rounded-sm border-2 border-dashed cursor-pointer transition-all duration-200
                    flex flex-col items-center justify-center gap-5 py-20 px-8
                    ${
                      isDragging
                        ? "border-primary bg-primary/5 scale-[0.992]"
                        : "border-border hover:border-primary/40 hover:bg-secondary/20"
                    }`}
                >
                  <div
                    className={`w-16 h-16 rounded-sm flex items-center justify-center transition-colors border ${
                      isDragging
                        ? "bg-primary/10 border-primary/20"
                        : "bg-secondary border-border"
                    }`}
                  >
                    <Upload
                      size={22}
                      className={isDragging ? "text-primary" : "text-muted-foreground"}
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-serif text-lg font-medium text-foreground mb-1">
                      {isDragging ? "Lepaskan file di sini" : "Tarik & Lepas Gambar"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      atau gunakan tombol di bawah untuk memilih file
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground/60 mt-1">
                      JPEG · PNG · WebP · maks. 10 MB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFilePicker();
                    }}
                    className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-sm hover:bg-primary/90 transition-colors tracking-wide"
                  >
                    Pilih Foto
                  </button>
                </div>
              )}

              {/* Selected */}
              {uploadState === "selected" && selectedImage && (
                <div className="p-7">
                  <div className="flex flex-col sm:flex-row gap-7 items-start">
                    <div className="relative flex-shrink-0">
                      <div className="w-52 h-52 rounded-sm overflow-hidden border border-border bg-muted shadow-sm">
                        <img
                          src={selectedImage}
                          alt="Citra telapak tangan yang dipilih"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={onReset}
                        title="Hapus"
                        className="absolute -top-2 -right-2 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
                      >
                        <X size={11} className="text-muted-foreground" />
                      </button>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <p className="text-sm font-semibold text-foreground">
                          Gambar siap diproses
                        </p>
                      </div>
                      <p className="text-[13px] text-muted-foreground leading-relaxed mb-7 max-w-xs">
                        Pastikan telapak tangan terlihat jelas, terbuka penuh,
                        dan tidak ada aksesori yang menghalangi sebelum
                        melanjutkan.
                      </p>

                      <div className="space-y-2.5">
                        <button
                          onClick={onPredict}
                          className="inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-6 py-2.5 rounded-sm text-sm font-semibold tracking-wide hover:bg-primary/90 active:scale-[0.98] transition-all"
                        >
                          Prediksi Gaya Belajar
                          <ArrowRight size={14} />
                        </button>
                        <div>
                          <button
                            onClick={onReset}
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium mt-1"
                          >
                            <RotateCcw size={11} />
                            Ganti gambar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {uploadState === "error" && (
                <div className="py-16 px-8 flex flex-col items-center gap-5">
                  <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-sm flex items-center justify-center">
                    <AlertCircle size={22} className="text-destructive" />
                  </div>
                  <div className="text-center">
                    <p className="font-serif text-lg font-medium text-foreground mb-1">
                      Gagal Memuat Gambar
                    </p>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      {errorMessage || "Terjadi kesalahan saat memproses gambar."}
                    </p>
                  </div>
                  <button
                    onClick={onReset}
                    className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-sm hover:bg-primary/90 transition-colors tracking-wide"
                  >
                    Coba Lagi
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Side panel — tips */}
          {isIdle && (
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-card border border-border rounded-sm overflow-hidden">
                <div className="h-0.5 bg-primary" />
                <div className="p-5">
                  <p className="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-primary mb-4">
                    Panduan Foto
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Telapak tangan menghadap ke atas, terbuka penuh",
                      "Pencahayaan merata — hindari bayangan",
                      "Jarak kamera cukup dekat agar detail terlihat",
                      "Tanpa aksesori: cincin, gelang, dll.",
                      "Latar belakang terang dan kontras",
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-4 h-4 flex-shrink-0 bg-secondary rounded-sm flex items-center justify-center mt-0.5">
                          <span className="font-mono text-[9px] font-medium text-primary">
                            {i + 1}
                          </span>
                        </span>
                        <p className="text-[12px] text-muted-foreground leading-relaxed">
                          {tip}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-secondary/50 border border-border rounded-sm p-4">
                <p className="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground mb-2">
                  Format yang Didukung
                </p>
                <div className="flex gap-2 flex-wrap">
                  {["JPEG", "PNG", "WebP"].map((fmt) => (
                    <span
                      key={fmt}
                      className="font-mono text-[11px] bg-card border border-border px-2 py-0.5 rounded-sm text-foreground"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Ukuran maksimal: 10 MB
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onInputChange}
        className="hidden"
      />

      <Footer />
    </div>
  );
}

// ─── Result Page ───────────────────────────────────────────────────────────────

function ResultPage({
  selectedImage,
  predictionResult,
  onNavigate,
}: {
  selectedImage: string | null;
  predictionResult: PredictionResult | null;
  onNavigate: (p: Page) => void;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        onNavigate={onNavigate}
        rightSlot={
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <Home size={12} />
            Beranda
          </button>
        }
      />

      <div className="max-w-6xl mx-auto px-8 py-14 w-full flex-1">
        {/* Back + heading */}
        <button
          onClick={() => onNavigate("upload")}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8 font-medium"
        >
          <ArrowLeft size={12} />
          Kembali ke Unggah
        </button>

        <div className="mb-10">
          <SectionLabel>Langkah 2 dari 2</SectionLabel>
          <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">
            Hasil Klasifikasi
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hasil klasifikasi akan ditampilkan setelah citra diproses oleh model
            CNN melalui backend.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-7">
          {/* Left — Image + badge placeholder */}
          <div className="lg:col-span-4 space-y-5">
            {/* Uploaded image */}
            <div className="bg-card border border-border rounded-sm overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-border">
                <p className="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground">
                  Foto yang Dianalisis
                </p>
              </div>
              <div className="p-4">
                <div className="aspect-square rounded-sm overflow-hidden bg-muted border border-border">
                  {selectedImage ? (
                    <img
                      src={selectedImage}
                      alt="Citra telapak tangan yang dianalisis"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">
                        Tidak ada gambar
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Predicted class badge */}
            <div className="bg-card border border-border rounded-sm overflow-hidden shadow-sm">
              {(() => {
                const style = predictionResult
                  ? VARK_STYLES.find((s) => s.key === predictionResult.predicted_class)
                  : null;
                return (
                  <>
                    <div className={`h-0.5 ${style ? style.dot.replace("bg-", "bg-") : "bg-muted-foreground/20"}`} />
                    <div className="p-5 flex flex-col items-center gap-3 py-8">
                      <div className={`w-20 h-20 rounded-sm border-2 ${style ? "border-solid border-current" : "border-dashed border-border"} flex items-center justify-center bg-secondary/30`}>
                        <span className={`font-serif text-4xl font-bold ${style ? style.letter : "text-muted-foreground/30"}`}>
                          {predictionResult ? predictionResult.predicted_class : "?"}
                        </span>
                      </div>
                      <div className="text-center">
                        <p className="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground mb-1">
                          Kategori Prediksi
                        </p>
                        <p className={`font-serif text-sm ${predictionResult ? "text-foreground font-medium" : "text-muted-foreground italic"}`}>
                          {predictionResult ? predictionResult.predicted_label : "Menunggu hasil model"}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground/40 mt-1">
                          predicted_class
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Right — Data fields + distribution */}
          <div className="lg:col-span-8 space-y-5">
            {/* Prediction fields */}
            <div className="bg-card border border-border rounded-sm overflow-hidden shadow-sm">
              <div className="h-0.5 bg-primary" />
              <div className="px-6 py-4 border-b border-border">
                <p className="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-primary">
                  Keluaran Model CNN
                </p>
              </div>
              <div className="divide-y divide-border">
                {[
                  {
                    label: "Gaya Belajar",
                    field: "predicted_label",
                    value: predictionResult ? predictionResult.predicted_label : null,
                    placeholder: "Menunggu hasil model",
                    italic: true,
                  },
                  {
                    label: "Kategori VARK",
                    field: "predicted_class",
                    value: predictionResult ? predictionResult.predicted_class : null,
                    placeholder: "—",
                    italic: false,
                  },
                  {
                    label: "Confidence",
                    field: "confidence",
                    value: predictionResult
                      ? `${(predictionResult.confidence * 100).toFixed(1)}%`
                      : null,
                    placeholder: "—",
                    italic: false,
                  },
                ].map(({ label, field, value, placeholder, italic }) => (
                  <div
                    key={field}
                    className="px-6 py-4 grid grid-cols-5 gap-4 items-center"
                  >
                    <div className="col-span-2">
                      <p className="text-[13px] font-medium text-foreground">
                        {label}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground/50 mt-0.5">
                        {field}
                      </p>
                    </div>
                    <div className="col-span-3 bg-secondary/40 border border-border rounded-sm px-4 py-2.5 min-h-[40px] flex items-center">
                      <p
                        className={`text-sm font-mono ${
                          value
                            ? "text-foreground font-medium"
                            : `text-muted-foreground ${italic ? "italic" : ""}`
                        }`}
                      >
                        {value ?? placeholder}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Probability distribution */}
            <div className="bg-card border border-border rounded-sm overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border">
                <p className="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground">
                  Distribusi Probabilitas
                  <span className="ml-1 text-primary/60">probabilities</span>
                </p>
              </div>
              <div className="p-6 space-y-5">
                {VARK_STYLES.map((style) => {
                  const prob = predictionResult
                    ? predictionResult.probabilities[style.key as "A" | "K" | "R" | "V"]
                    : null;
                  const pct = prob !== null ? `${(prob * 100).toFixed(1)}%` : "—";
                  const barWidth = prob !== null ? `${prob * 100}%` : "0%";
                  return (
                    <div key={style.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                          <span className="font-mono text-xs font-medium text-foreground">
                            {style.key}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {style.nameId}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-muted-foreground/50">
                          {pct}
                        </span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${style.dot}`}
                          style={{ width: barWidth }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="pt-3 border-t border-border">
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    {predictionResult
                      ? `Probabilitas tertinggi: ${predictionResult.predicted_class} (${(predictionResult.confidence * 100).toFixed(1)}%)`
                      : "Distribusi probabilitas tiap kategori akan terisi setelah prediksi dijalankan melalui API model CNN."}
                  </p>
                </div>
              </div>
            </div>

            {/* API note */}
            <div className="bg-secondary/30 border border-border rounded-sm p-5">
              <p className="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground mb-2">
                Catatan Prototype
              </p>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Halaman ini menampilkan struktur keluaran yang akan diisi
                respons backend. Field{" "}
                {[
                  "predicted_class",
                  "predicted_label",
                  "confidence",
                  "probabilities",
                ].map((f, i, arr) => (
                  <span key={f}>
                    <code className="font-mono text-[11px] bg-muted border border-border px-1.5 py-px rounded-sm text-foreground">
                      {f}
                    </code>
                    {i < arr.length - 1 ? ", " : " "}
                  </span>
                ))}
                diterima dari model CNN melalui endpoint{" "}
                <code className="font-mono text-[11px] bg-muted border border-border px-1.5 py-px rounded-sm text-primary">
                  POST /api/predict
                </code>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={() => onNavigate("upload")}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-7 py-3 rounded-sm text-sm font-semibold tracking-wide hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            <RotateCcw size={13} />
            Prediksi Ulang
          </button>
          <button
            onClick={() => onNavigate("home")}
            className="inline-flex items-center justify-center gap-2 bg-card text-foreground border border-border px-7 py-3 rounded-sm text-sm font-semibold tracking-wide hover:bg-secondary/40 transition-colors"
          >
            <Home size={13} />
            Kembali ke Beranda
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [uploadState, setUploadState] = useState<UploadState>("empty");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigateTo = useCallback(
    (p: Page) => {
      if (p === "upload" && page !== "upload") {
        setUploadState("empty");
        setSelectedImage(null);
        setSelectedFile(null);
        setErrorMessage("");
      }
      setPage(p);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [page]
  );

  const validateFile = (file: File): boolean => {
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Format tidak didukung. Gunakan JPEG, PNG, atau WebP.");
      setUploadState("error");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Ukuran file terlalu besar. Maksimal 10 MB.");
      setUploadState("error");
      return false;
    }
    return true;
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!validateFile(file)) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setUploadState("selected");
      setErrorMessage("");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  const handlePredict = async () => {
    if (!selectedFile) return;
    setUploadState("loading");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch("http://127.0.0.1:5000/api/predict", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error ?? "Prediksi gagal. Coba lagi.");
        setUploadState("error");
        return;
      }
      setPredictionResult(data);
      setPage("result");
    } catch {
      setErrorMessage("Gagal terhubung ke server. Pastikan backend berjalan.");
      setUploadState("error");
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setUploadState("empty");
    setErrorMessage("");
  };

  return (
    <>
      {page === "home" && <HomePage onNavigate={navigateTo} />}
      {page === "upload" && (
        <UploadPage
          uploadState={uploadState}
          selectedImage={selectedImage}
          isDragging={isDragging}
          errorMessage={errorMessage}
          fileInputRef={fileInputRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onInputChange={handleInputChange}
          onPredict={handlePredict}
          onReset={handleReset}
          onNavigate={navigateTo}
          onOpenFilePicker={() => fileInputRef.current?.click()}
        />
      )}
      {page === "result" && (
        <ResultPage
          selectedImage={selectedImage}
          predictionResult={predictionResult}
          onNavigate={navigateTo}
        />
      )}
    </>
  );
}
