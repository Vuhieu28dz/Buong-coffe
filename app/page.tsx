"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/*
 * BuyFood — Quán nước: trà sữa, matcha, cà phê, trà trái cây
 *
 * Cách dùng: mở file app/page.tsx trong project Next.js, xóa hết nội
 * dung cũ, paste toàn bộ file này vào, rồi chạy `npm run dev`.
 * Không cần cài thêm thư viện nào, chỉ dùng Tailwind có sẵn.
 *
 * Bên dưới giao diện là đầy đủ thuật toán của đề tài (tìm kiếm tuyến
 * tính / nhị phân, quick / merge / heap / bubble / insertion /
 * selection sort) — bản giống hệt code C++ trong file main.cpp nộp kèm.
 * Giao diện không ghi tên thuật toán để trông như quán thật.
 */

// ---------------------------------------------------------------------------
// Kiểu dữ liệu
// ---------------------------------------------------------------------------
export type Product = {
  id: number; // mã món
  name: string;
  short: string; // tên ngắn để ghi lên vòng quay
  category: string;
  price: number; // VND
  sold: number; // số ly đã bán trong tuần này
  stock: number;
  image: string;
};

const vnd = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " đ";

// ---------------------------------------------------------------------------
// Thực đơn: 15 món, 5 nhóm. Số ly bán ra là số liệu một tuần của quán.
// ---------------------------------------------------------------------------
export const SEED_PRODUCTS: Product[] = [
  { id: 101, name: "Trà sữa trân châu đường đen", short: "Trà sữa trân châu", category: "Trà sữa", price: 35000, sold: 186, stock: 40, image: "https://brewingboba.com/wp-content/uploads/2025/03/Bubble-Tea.png" },
  { id: 102, name: "Trà sữa matcha", short: "Trà sữa matcha", category: "Matcha", price: 38000, sold: 142, stock: 35, image: "https://thelittlestcrumb.com/wp-content/uploads/matcha-milk-tea-4.jpg" },
  { id: 103, name: "Cà phê sữa đá", short: "Cà phê sữa đá", category: "Cà phê", price: 25000, sold: 168, stock: 50, image: "https://575bistro.com/img/vietnamese-iced-coffee-ca-phe-sua-da.webp" },
  { id: 104, name: "Cà phê đen đá", short: "Cà phê đen đá", category: "Cà phê", price: 20000, sold: 96, stock: 50, image: "https://mydishory.com/wp-content/uploads/2025/10/kszlmg2t7yyrnckqmhhd.webp" },
  { id: 105, name: "Trà đào cam sả", short: "Trà đào cam sả", category: "Trà trái cây", price: 32000, sold: 128, stock: 30, image: "https://yousaypotatoes.com/wp-content/uploads/2022/06/peach-iced-tea-2.jpg" },
  { id: 106, name: "Trà chanh mật ong", short: "Trà chanh mật ong", category: "Trà trái cây", price: 25000, sold: 87, stock: 40, image: "https://www.mycookinglibrary.com/wp-content/uploads/2026/01/file-336.png" },
  { id: 107, name: "Matcha latte đá", short: "Matcha latte đá", category: "Matcha", price: 42000, sold: 119, stock: 30, image: "https://static.vecteezy.com/system/resources/previews/060/730/948/non_2x/iced-matcha-latte-in-glass-free-photo.jpg" },
  { id: 108, name: "Trà sữa thái xanh", short: "Trà sữa thái xanh", category: "Trà sữa", price: 35000, sold: 104, stock: 35, image: "https://bangkokstreetmookata.com.sg/wp-content/uploads/Green-Thai-Milk-Tea-1.jpg" },
  { id: 109, name: "Sinh tố bơ", short: "Sinh tố bơ", category: "Sinh tố & Nước ép", price: 40000, sold: 76, stock: 25, image: "https://i.pinimg.com/474x/5b/99/be/5b99be4fb00f0a0fb822b1ed7c95c9bb.jpg" },
  { id: 110, name: "Nước ép cam tươi", short: "Nước ép cam tươi", category: "Sinh tố & Nước ép", price: 30000, sold: 93, stock: 30, image: "https://miro.medium.com/v2/resize:fit:1024/1*kOpdfC0o71lmDmnAjBg2Ag.jpeg" },
  { id: 111, name: "Trà sữa khoai môn", short: "Trà sữa khoai môn", category: "Trà sữa", price: 38000, sold: 88, stock: 30, image: "https://tyberrymuch.com/wp-content/uploads/2022/07/real-taro-milk-bubble-tea-index.jpg" },
  { id: 112, name: "Cà phê bạc xỉu", short: "Cà phê bạc xỉu", category: "Cà phê", price: 28000, sold: 121, stock: 40, image: "https://images-pw.pixieset.com/elementfield/59643997/_NV_9582-7115093e.jpg" },
  { id: 113, name: "Trà vải hạt sen", short: "Trà vải hạt sen", category: "Trà trái cây", price: 36000, sold: 64, stock: 25, image: "https://sst-s3-demo-bucket.s3.amazonaws.com/shops/tiktikboba/512_a36e360a-70f4-44c9-aebb-e0e0a1f65a2f_image_1920" },
  { id: 114, name: "Sữa tươi trân châu đường đen", short: "Sữa tươi trân châu", category: "Trà sữa", price: 32000, sold: 97, stock: 35, image: "https://ejfutcrupcbqvormtfee.supabase.co/storage/v1/object/public/product-images/0e448ef2-621d-4f88-8b42-0bd70ad52ffa/e25f06bc-b5e4-4729-9cf3-f3878d941973/generated-products/31ce1cb5-e127-4549-8305-fc8e3631df85/brown-sugar-milk-48de19466ec8.webp" },
  { id: 115, name: "Matcha đá xay", short: "Matcha đá xay", category: "Matcha", price: 45000, sold: 71, stock: 25, image: "https://framerusercontent.com/images/cxclDt9J5sOcZtQqHg1GQJGbs.png?width=1200&height=1200" },
];

// ---------------------------------------------------------------------------
// Tìm kiếm (giống hệt bản C++)
// ---------------------------------------------------------------------------
const lower = (s: string) => s.toLowerCase();

/** Tìm tuyến tính theo tên (tìm gần đúng, không phân biệt hoa thường). O(n) */
export function linearSearchByName(products: Product[], query: string) {
  const q = lower(query);
  const indices: number[] = [];
  let comparisons = 0;
  for (let i = 0; i < products.length; i++) {
    comparisons++;
    if (lower(products[i].name).includes(q)) indices.push(i);
  }
  return { indices, comparisons };
}

/** Tìm tuyến tính theo mã. O(n) */
export function linearSearchById(products: Product[], id: number) {
  let comparisons = 0;
  for (let i = 0; i < products.length; i++) {
    comparisons++;
    if (products[i].id === id) return { index: i, comparisons };
  }
  return { index: -1, comparisons };
}

/** Tìm nhị phân theo mã. Mảng đầu vào PHẢI sắp xếp theo mã tăng dần. O(log n) */
export function binarySearchById(sorted: Product[], id: number) {
  let comparisons = 0;
  let left = 0;
  let right = sorted.length - 1;
  while (left <= right) {
    comparisons++;
    const mid = left + Math.floor((right - left) / 2);
    if (sorted[mid].id === id) return { index: mid, comparisons };
    if (sorted[mid].id < id) left = mid + 1;
    else right = mid - 1;
  }
  return { index: -1, comparisons };
}

/** Tìm nhị phân theo tên (khớp chính xác). Mảng đầu vào PHẢI sắp xếp theo tên. O(log n) */
export function binarySearchByName(sorted: Product[], query: string) {
  const q = lower(query);
  let comparisons = 0;
  let left = 0;
  let right = sorted.length - 1;
  while (left <= right) {
    comparisons++;
    const mid = left + Math.floor((right - left) / 2);
    const midName = lower(sorted[mid].name);
    if (midName === q) return { index: mid, comparisons };
    if (midName < q) left = mid + 1;
    else right = mid - 1;
  }
  return { index: -1, comparisons };
}

// ---------------------------------------------------------------------------
// Sắp xếp (tự viết tay, giống hệt bản C++)
// ---------------------------------------------------------------------------
export type Compare = (a: Product, b: Product) => boolean;
export const byPriceAsc: Compare = (a, b) => a.price < b.price;
export const byPriceDesc: Compare = (a, b) => a.price > b.price;
export const byNameAsc: Compare = (a, b) => lower(a.name) < lower(b.name);
export const bySoldDesc: Compare = (a, b) => a.sold > b.sold;
export const byIdAsc: Compare = (a, b) => a.id < b.id;

/** Quick sort. Trung bình O(n log n), xấu nhất O(n^2). */
export function quickSort(arr: Product[], cmp: Compare): Product[] {
  const v = [...arr];
  const partition = (low: number, high: number): number => {
    const pivot = v[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
      if (cmp(v[j], pivot)) {
        i++;
        [v[i], v[j]] = [v[j], v[i]];
      }
    }
    [v[i + 1], v[high]] = [v[high], v[i + 1]];
    return i + 1;
  };
  const sort = (low: number, high: number): void => {
    if (low < high) {
      const p = partition(low, high);
      sort(low, p - 1);
      sort(p + 1, high);
    }
  };
  sort(0, v.length - 1);
  return v;
}

/** Merge sort (ổn định). Luôn O(n log n). */
export function mergeSort(arr: Product[], cmp: Compare): Product[] {
  const v = [...arr];
  const merge = (left: number, mid: number, right: number): void => {
    const tmp: Product[] = [];
    let i = left;
    let j = mid + 1;
    while (i <= mid && j <= right) {
      if (cmp(v[i], v[j])) tmp.push(v[i++]);
      else tmp.push(v[j++]);
    }
    while (i <= mid) tmp.push(v[i++]);
    while (j <= right) tmp.push(v[j++]);
    for (let k = 0; k < tmp.length; k++) v[left + k] = tmp[k];
  };
  const sort = (left: number, right: number): void => {
    if (left < right) {
      const mid = left + Math.floor((right - left) / 2);
      sort(left, mid);
      sort(mid + 1, right);
      merge(left, mid, right);
    }
  };
  sort(0, v.length - 1);
  return v;
}

/** Heap sort. Luôn O(n log n). */
export function heapSort(arr: Product[], cmp: Compare): Product[] {
  const v = [...arr];
  const n = v.length;
  const heapify = (size: number, i: number): void => {
    let largest = i;
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    if (l < size && cmp(v[largest], v[l])) largest = l;
    if (r < size && cmp(v[largest], v[r])) largest = r;
    if (largest !== i) {
      [v[i], v[largest]] = [v[largest], v[i]];
      heapify(size, largest);
    }
  };
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);
  for (let i = n - 1; i > 0; i--) {
    [v[0], v[i]] = [v[i], v[0]];
    heapify(i, 0);
  }
  return v;
}

/** Bubble sort. O(n^2) — chỉ hợp với danh sách nhỏ. */
export function bubbleSort(arr: Product[], cmp: Compare): Product[] {
  const v = [...arr];
  for (let i = 0; i < v.length - 1; i++)
    for (let j = 0; j < v.length - i - 1; j++)
      if (cmp(v[j + 1], v[j])) [v[j], v[j + 1]] = [v[j + 1], v[j]];
  return v;
}

/** Insertion sort. O(n^2) — nhanh khi dữ liệu gần như đã sắp xếp. */
export function insertionSort(arr: Product[], cmp: Compare): Product[] {
  const v = [...arr];
  for (let i = 1; i < v.length; i++) {
    const key = v[i];
    let j = i - 1;
    while (j >= 0 && cmp(key, v[j])) {
      v[j + 1] = v[j];
      j--;
    }
    v[j + 1] = key;
  }
  return v;
}

/** Selection sort. O(n^2) — số lần đổi chỗ ít nhất. */
export function selectionSort(arr: Product[], cmp: Compare): Product[] {
  const v = [...arr];
  for (let i = 0; i < v.length - 1; i++) {
    let best = i;
    for (let j = i + 1; j < v.length; j++) if (cmp(v[j], v[best])) best = j;
    if (best !== i) [v[i], v[best]] = [v[best], v[i]];
  }
  return v;
}

export type SortAlgo = "quick" | "merge" | "heap" | "bubble" | "insertion" | "selection";

export function sortBy(arr: Product[], algo: SortAlgo, cmp: Compare): Product[] {
  switch (algo) {
    case "merge": return mergeSort(arr, cmp);
    case "heap": return heapSort(arr, cmp);
    case "bubble": return bubbleSort(arr, cmp);
    case "insertion": return insertionSort(arr, cmp);
    case "selection": return selectionSort(arr, cmp);
    default: return quickSort(arr, cmp);
  }
}

/** Top N bán chạy nhất (heap sort theo số ly đã bán). */
export function topBestSelling(products: Product[], n: number): Product[] {
  return heapSort(products, bySoldDesc).slice(0, n);
}

/** Top N đắt nhất (heap sort theo giá giảm dần). */
export function topMostExpensive(products: Product[], n: number): Product[] {
  return heapSort(products, byPriceDesc).slice(0, n);
}

// ---------------------------------------------------------------------------
// Vòng quay may mắn: tính góc quay để kim dừng đúng ô trúng thưởng.
// Kim chỉ ở đỉnh vòng quay (góc 0). Ô i chiếm [i*seg, (i+1)*seg] tính
// từ đỉnh theo chiều kim đồng hồ, tâm ô là (i + 0.5) * seg.
// ---------------------------------------------------------------------------
export function computeSpinRotation(currentRotation: number, winnerIndex: number, itemCount: number): number {
  const seg = 360 / itemCount;
  const center = (winnerIndex + 0.5) * seg;
  const current = ((currentRotation % 360) + 360) % 360;
  const delta = (((360 - center - current) % 360) + 360) % 360;
  return currentRotation + 360 * 5 + delta; // quay thêm 5 vòng rồi dừng đúng ô
}

// ---------------------------------------------------------------------------
// Đo tốc độ thuật toán (để viết báo cáo; giao diện không hiện phần này)
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function runBenchmark(size: number) {
  const rand = mulberry32(42);
  const base: Product[] = Array.from({ length: size }, (_, i) => ({
    id: 1000 + i,
    name: `Món ${1000 + i}`,
    short: `Món ${1000 + i}`,
    category: "Benchmark",
    price: Math.floor(5000 + rand() * 45000),
    sold: Math.floor(rand() * 200),
    stock: Math.floor(rand() * 50),
    image: "",
  }));
  const timeMs = (fn: () => void) => {
    const t0 = performance.now();
    fn();
    return performance.now() - t0;
  };
  const lin = linearSearchById(base, -1);
  const byId = quickSort(base, byIdAsc);
  const bin = binarySearchById(byId, -1);
  const tLin = timeMs(() => linearSearchById(base, -1));
  const tBin = timeMs(() => binarySearchById(byId, -1));
  const sorts: Record<SortAlgo, number> = {
    quick: timeMs(() => sortBy(base, "quick", byPriceAsc)),
    merge: timeMs(() => sortBy(base, "merge", byPriceAsc)),
    heap: timeMs(() => sortBy(base, "heap", byPriceAsc)),
    bubble: timeMs(() => sortBy(base, "bubble", byPriceAsc)),
    insertion: timeMs(() => sortBy(base, "insertion", byPriceAsc)),
    selection: timeMs(() => sortBy(base, "selection", byPriceAsc)),
  };
  return {
    size,
    search: {
      linearMs: tLin, binaryMs: tBin,
      linearComparisons: lin.comparisons, binaryComparisons: bin.comparisons,
    },
    sorts,
  };
}

// ---------------------------------------------------------------------------
// Giao diện
// ---------------------------------------------------------------------------
const CATEGORIES = ["Tất cả", "Trà sữa", "Matcha", "Cà phê", "Trà trái cây", "Sinh tố & Nước ép"];

const SORT_OPTIONS = [
  { value: "", label: "Nổi bật" },
  { value: "price_asc", label: "Giá: thấp đến cao" },
  { value: "price_desc", label: "Giá: cao đến thấp" },
  { value: "name", label: "Tên (A–Z)" },
  { value: "sold", label: "Bán chạy nhất" },
];

const WHEEL_COLORS = [
  "#10b981", "#f59e0b", "#ef4444", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
  "#84cc16", "#06b6d4", "#a855f7", "#eab308",
  "#f43f5e", "#22c55e", "#0ea5e9",
];

const MAX_WHEEL_ITEMS = 8;

// Nhạc nền YouTube: muốn đổi bài khác thì thay ID video ở đây
// (ID là phần sau "v=" trong link YouTube, ví dụ link ...watch?v=je_eYUdGXqs thì ID là je_eYUdGXqs).
// Bài hiện tại: "Morning Tea & Cake" - nhạc quán cà phê vintage của Soft Atelier.
const YOUTUBE_MUSIC_ID = "je_eYUdGXqs";

function ProductCard({
  p,
  rank,
  inWheel,
  wheelFull,
  onAddToWheel,
}: {
  p: Product;
  rank: number; // 1..3 = best seller, 0 = thường
  inWheel: boolean;
  wheelFull: boolean;
  onAddToWheel: (p: Product) => void;
}) {
  const low = p.stock < 30;
  return (
    <article
      className={`relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ${
        rank === 1 ? "ring-2 ring-amber-400" : ""
      }`}
    >
      {rank > 0 && (
        <span
          className={`absolute left-2 top-2 z-10 rounded-full px-2 py-1 text-xs font-extrabold text-white shadow ${
            rank === 1 ? "animate-pulse bg-amber-500" : "bg-amber-500/90"
          }`}
        >
          ★ {rank === 1 ? "Bán chạy #1" : "Best Seller"}
        </span>
      )}
      {/* Ảnh món: có lớp nền dự phòng, link ảnh lỗi thì tự ẩn ảnh để không hiện icon vỡ */}
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-amber-100 via-emerald-50 to-amber-200">
        <div className="absolute inset-0 flex items-center justify-center text-5xl">🥤</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.image}
          alt={p.name}
          className="relative h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
          {p.category} · #{p.id}
        </span>
        <h3 className="min-h-10 text-[15px] font-semibold leading-snug">{p.name}</h3>
        <div className="text-lg font-extrabold text-amber-700">{vnd(p.price)}</div>
        <div className="text-[13px] text-zinc-500">🔥 Đã bán {p.sold} ly tuần này</div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              low ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}
          >
            {low ? "Sắp hết" : "Còn hàng"}: {p.stock} ly
          </span>
          <button
            onClick={() => onAddToWheel(p)}
            disabled={inWheel || wheelFull}
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              inWheel
                ? "bg-emerald-100 text-emerald-700"
                : wheelFull
                  ? "bg-zinc-100 text-zinc-400"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {inWheel ? "✓ Trong vòng quay" : "🎡 Vòng quay"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [products] = useState<Product[]>(SEED_PRODUCTS);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [searchInfo, setSearchInfo] = useState("");
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);

  // Vòng quay may mắn
  const [wheelItems, setWheelItems] = useState<Product[]>([]);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Product | null>(null);
  const [ordered, setOrdered] = useState("");
  const [musicOn, setMusicOn] = useState(false);
  const musicPlayerRef = useRef<any>(null);
  const musicReadyRef = useRef(false);
  const musicPendingRef = useRef(false);

  // Nhạc nền YouTube qua IFrame API: bấm nút là phát/dừng ngay (gọi trực tiếp trong
  // thao tác bấm nên trình duyệt cho phát tiếng, không trông chờ vào tự chạy ngầm).
  useEffect(() => {
    const createPlayer = () => {
      if (musicPlayerRef.current) return;
      musicPlayerRef.current = new (window as any).YT.Player("yt-music-player", {
        videoId: YOUTUBE_MUSIC_ID,
        width: "1",
        height: "1",
        playerVars: { autoplay: 0, loop: 1, playlist: YOUTUBE_MUSIC_ID },
        events: {
          onReady: () => {
            musicReadyRef.current = true;
            if (musicPendingRef.current) {
              musicPlayerRef.current?.playVideo();
              musicPendingRef.current = false;
            }
          },
          onStateChange: (e: any) => {
            setMusicOn(e.data === (window as any).YT.PlayerState.PLAYING);
          },
        },
      });
    };
    if ((window as any).YT?.Player) {
      createPlayer();
    } else {
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
      (window as any).onYouTubeIframeAPIReady = () => createPlayer();
    }
    return () => {
      musicPlayerRef.current?.destroy?.();
      musicPlayerRef.current = null;
      musicReadyRef.current = false;
    };
  }, []);

  function toggleMusic() {
    if (!musicReadyRef.current) {
      // API chưa nạp xong: ghi nhớ ý định, sẵn sàng là phát luôn
      musicPendingRef.current = !musicOn;
      setMusicOn(!musicOn);
      return;
    }
    if (musicOn) musicPlayerRef.current?.pauseVideo();
    else musicPlayerRef.current?.playVideo();
  }
  const fireworksRef = useRef<HTMLCanvasElement | null>(null);

  // Pháo hoa chúc mừng khi quay trúng (canvas, tự vẽ, không cần thư viện ngoài).
  function launchFireworks() {
    const canvas = fireworksRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#f59e0b", "#10b981", "#ec4899", "#3b82f6", "#ef4444", "#eab308", "#8b5cf6"];
    type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number };
    const parts: Particle[] = [];
    const burst = (x: number, y: number) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 70; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 2 + Math.random() * 6;
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, color, size: 2 + Math.random() * 3 });
      }
    };
    // 6 đợt pháo hoa nở ở vị trí ngẫu nhiên trên màn hình
    for (let i = 0; i < 6; i++) {
      window.setTimeout(() => {
        burst(window.innerWidth * (0.2 + Math.random() * 0.6), window.innerHeight * (0.15 + Math.random() * 0.4));
      }, i * 350);
    }
    const start = performance.now();
    const tick = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.life -= 0.012;
        if (p.life <= 0) {
          parts.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (now - start < 3500) {
        requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    requestAnimationFrame(tick);
  }

  const stats = useMemo(() => {
    const totalSold = products.reduce((s, p) => s + p.sold, 0);
    const avg = products.length ? products.reduce((s, p) => s + p.price, 0) / products.length : 0;
    return { total: products.length, totalSold, avg };
  }, [products]);

  // Top 3 bán chạy nhất tuần -> gắn sao
  const bestSellerRank = useMemo(() => {
    const map = new Map<number, number>();
    topBestSelling(products, 3).forEach((p, i) => map.set(p.id, i + 1));
    return map;
  }, [products]);

  const bestSellers = useMemo(() => topBestSelling(products, 5), [products]);

  const visible = useMemo(() => {
    let list = searchResults ?? products;
    if (searchResults === null && category !== "Tất cả") {
      list = list.filter((p) => p.category === category);
    }
    if (sortKey) {
      const cmp =
        sortKey === "price_desc" ? byPriceDesc : sortKey === "name" ? byNameAsc : sortKey === "sold" ? bySoldDesc : byPriceAsc;
      const algo: SortAlgo = sortKey === "name" ? "merge" : sortKey === "sold" ? "heap" : "quick";
      list = sortBy(list, algo, cmp);
    }
    return list;
  }, [products, searchResults, category, sortKey]);

  // Khi đang tìm kiếm, sắp xếp hoặc lọc theo loại -> kết quả hiện lên đầu trang
  const hasActiveFilter = searchResults !== null || sortKey !== "" || category !== "Tất cả";
  const resultTitle =
    searchResults !== null
      ? "🔍 Kết quả tìm kiếm"
      : sortKey !== ""
        ? `🔃 Đã sắp xếp (${SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? ""})`
        : `📂 ${category}`;

  function doSearch() {
    const q = query.trim();
    if (!q) {
      setSearchInfo("");
      setSearchResults(null);
      return;
    }
    let found: Product[] = [];
    if (/^\d+$/.test(q)) {
      // Gõ số -> tìm theo mã (tìm nhị phân trên danh sách đã xếp theo mã)
      const byId = quickSort(products, byIdAsc);
      const r = binarySearchById(byId, parseInt(q, 10));
      if (r.index >= 0) found = [byId[r.index]];
    } else {
      // Gõ chữ -> tìm theo tên (tìm tuyến tính, tìm gần đúng)
      const r = linearSearchByName(products, q);
      found = r.indices.map((i) => products[i]);
    }
    setSearchInfo(
      found.length > 0
        ? `Tìm thấy ${found.length} món cho "${q}".`
        : `Không tìm thấy món nào cho "${q}". Thử từ khác nhé.`
    );
    setSearchResults(found);
  }

  function resetSearch() {
    setQuery("");
    setSearchInfo("");
    setSearchResults(null);
  }

  function addToWheel(p: Product) {
    if (wheelItems.some((w) => w.id === p.id)) return;
    if (wheelItems.length >= MAX_WHEEL_ITEMS) return;
    setWheelItems((ws) => [...ws, p]);
    setWinner(null);
    setOrdered("");
  }

  function removeFromWheel(id: number) {
    setWheelItems((ws) => ws.filter((w) => w.id !== id));
    setWinner(null);
    setOrdered("");
  }

  function spin(items: Product[]) {
    if (spinning || items.length === 0) return;
    const winnerIndex = Math.floor(Math.random() * items.length);
    const target = computeSpinRotation(rotation, winnerIndex, items.length);
    setWinner(null);
    setOrdered("");
    setSpinning(true);
    setRotation(target);
    window.setTimeout(() => {
      setWinner(items[winnerIndex]);
      setSpinning(false);
      launchFireworks();
    }, 4700);
  }

  const wheelGradient =
    wheelItems.length > 0
      ? `conic-gradient(${wheelItems
          .map((_, i) => {
            const seg = 360 / wheelItems.length;
            return `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${i * seg}deg ${(i + 1) * seg}deg`;
          })
          .join(", ")})`
      : undefined;

  return (
    <div className="min-h-screen overflow-x-clip bg-amber-50 text-zinc-900">
      {/* Lớp pháo hoa phủ toàn màn hình khi quay trúng */}
      <canvas ref={fireworksRef} className="pointer-events-none fixed inset-0 z-50" />
      {/* Nút bật/tắt nhạc nền YouTube (khách bấm mới phát vì trình duyệt chặn tự phát nhạc có tiếng) */}
      <button
        onClick={toggleMusic}
        className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full bg-[#8A9A5B] px-4 py-3 text-sm font-bold text-white shadow-lg hover:brightness-110"
      >
        <span className={musicOn ? "inline-block animate-[spin_3s_linear_infinite]" : ""}>🎵</span>
        {musicOn ? "Đang phát nhạc…" : "Bật nhạc"}
      </button>
      {/* Trình phát nhạc ẩn (chỉ 1px, không hiện video) */}
      <div id="yt-music-player" className="pointer-events-none fixed bottom-0 left-0 h-px w-px opacity-0" />
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#8A9A5B] py-4 shadow">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-5">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl">☕</span>
              <span className="bg-gradient-to-r from-amber-100 via-white to-amber-200 bg-clip-text font-serif text-3xl font-black italic tracking-wide text-transparent drop-shadow-sm">
                Buông Coffee
              </span>
            </div>
            <div className="text-xs font-medium text-white/85">Trà sữa • Matcha • Cà phê • Trà trái cây</div>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              placeholder='Tìm đồ uống… (thử: "trà sữa", "matcha", "cà phê")'
              className="min-w-48 flex-1 rounded-lg border-0 px-3 py-2.5 text-[15px]"
            />
            <button onClick={doSearch} className="rounded-lg bg-amber-500 px-5 py-2.5 font-bold text-white hover:brightness-110">
              Tìm
            </button>
            <button onClick={resetSearch} className="rounded-lg bg-white/20 px-4 py-2.5 font-bold text-white hover:bg-white/30">
              Đặt lại
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-10 pt-6">
        {/* Thống kê tuần */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { n: String(stats.total), l: "Món trong thực đơn" },
            { n: `${stats.totalSold.toLocaleString("vi-VN")} ly`, l: "Đã bán tuần này" },
            { n: vnd(Math.round(stats.avg / 1000) * 1000), l: "Giá trung bình" },
            { n: "4.9 ★", l: "128 đánh giá từ khách" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl bg-white p-4 text-center shadow-sm">
              <div className="text-2xl font-extrabold text-emerald-700">{s.n}</div>
              <div className="text-[13px] text-zinc-500">{s.l}</div>
            </div>
          ))}
        </section>

        {searchInfo && <p className="mt-4 font-semibold text-emerald-700">{searchInfo}</p>}

        {/* Sắp xếp + lọc */}
        <section className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-semibold">Sắp xếp theo</label>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm">
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCategory(c);
                  setSearchResults(null);
                  setSearchInfo("");
                }}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                  category === c ? "border-emerald-700 bg-emerald-700 text-white" : "border-zinc-300 bg-white text-zinc-700"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        {/* Kết quả tìm kiếm / sắp xếp / lọc: chỉ hiện khi có thao tác, luôn ở trên cùng */}
        {hasActiveFilter && (
          <>
            <h2 className="mt-6 text-xl font-bold">
              {resultTitle} <span className="text-base text-emerald-700">({visible.length})</span>
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
              {visible.map((p) => (
                <ProductCard
                  key={p.id}
                  p={p}
                  rank={bestSellerRank.get(p.id) ?? 0}
                  inWheel={wheelItems.some((w) => w.id === p.id)}
                  wheelFull={wheelItems.length >= MAX_WHEEL_ITEMS}
                  onAddToWheel={addToWheel}
                />
              ))}
            </div>
            {visible.length === 0 && <p className="mt-4 text-zinc-500">Không tìm thấy món nào.</p>}
          </>
        )}

        {/* Bán chạy nhất tuần */}
        <h2 className="mt-8 text-xl font-bold">🔥 Bán chạy nhất tuần</h2>
        <p className="mb-3 text-sm text-zinc-500">Top 5 món được gọi nhiều nhất trong tuần này.</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {bestSellers.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              rank={bestSellerRank.get(p.id) ?? 0}
              inWheel={wheelItems.some((w) => w.id === p.id)}
              wheelFull={wheelItems.length >= MAX_WHEEL_ITEMS}
              onAddToWheel={addToWheel}
            />
          ))}
        </div>

        {/* Vòng quay may mắn */}
        <section className="mt-10 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold">🎡 Hôm nay uống gì?</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Chưa biết uống gì? Bấm <b>“🎡 Vòng quay”</b> ở món bạn đang phân vân để thêm vào vòng quay (tối đa {MAX_WHEEL_ITEMS} món),
            rồi quay — vòng quay sẽ chọn giúp bạn một món.
          </p>
          <div className="mt-5 flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-center">
            <div className="flex flex-col items-center">
              <div className="text-3xl leading-none text-zinc-800">▼</div>
              {/* Vòng quay co theo màn hình: 272px trên điện thoại hẹp, 340px từ 400px trở lên */}
              <div className="relative h-[var(--ws)] w-[var(--ws)] [--ws:272px] min-[400px]:[--ws:340px]">
                {wheelItems.length > 0 ? (
                  <div
                    className="h-full w-full rounded-full border-4 border-white shadow-lg transition-transform"
                    style={{
                      background: wheelGradient,
                      transform: `rotate(${rotation}deg)`,
                      transitionDuration: spinning ? "4.5s" : "0s",
                      transitionTimingFunction: "cubic-bezier(0.15, 0.9, 0.1, 1)",
                    }}
                  >
                    {wheelItems.map((item, i) => {
                      const angle = (i + 0.5) * (360 / wheelItems.length);
                      return (
                        <span
                          key={item.id}
                          className="absolute left-1/2 top-1/2 max-w-[64px] text-center text-[11px] font-bold leading-[1.15] text-white drop-shadow"
                          style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(calc(var(--ws) * -0.388))` }}
                        >
                          {item.short}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full border-4 border-dashed border-zinc-300 bg-zinc-50 text-center text-sm text-zinc-400">
                    Chưa có món nào
                    <br />
                    trong vòng quay
                  </div>
                )}
                <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-2xl shadow">
                  🎡
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => spin(wheelItems)}
                  disabled={spinning || wheelItems.length === 0}
                  className="rounded-full bg-amber-500 px-6 py-3 font-extrabold text-white shadow hover:brightness-110 disabled:opacity-40"
                >
                  {spinning ? "Đang quay…" : "QUAY NGAY"}
                </button>
                <button
                  onClick={() => {
                    setWheelItems(products);
                    setWinner(null);
                    setOrdered("");
                  }}
                  disabled={spinning}
                  className="rounded-full border border-emerald-700 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
                >
                  Quay với tất cả 15 món
                </button>
              </div>
            </div>

            <div className="w-full max-w-sm">
              <h3 className="font-bold">Món trong vòng quay ({wheelItems.length}/{MAX_WHEEL_ITEMS})</h3>
              {wheelItems.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">
                  Bạn chưa thêm món nào. Bấm nút <b>“🎡 Vòng quay”</b> trên thẻ món để thêm món bạn đang phân vân.
                </p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2">
                  {wheelItems.map((item) => (
                    <li key={item.id} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm">
                      <span>
                        <b>{item.name}</b> — {vnd(item.price)}
                      </span>
                      <button onClick={() => removeFromWheel(item.id)} disabled={spinning} className="font-bold text-red-500 hover:underline disabled:opacity-40">
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {winner && (
                <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-center">
                  <div className="text-lg font-extrabold text-emerald-700">
                    <span className="inline-block animate-bounce">🎉</span> Hôm nay bạn uống:
                  </div>
                  <div className="mt-1 text-xl font-bold">{winner.name}</div>
                  <div className="text-amber-700 font-extrabold">{vnd(winner.price)}</div>
                  <button
                    onClick={() => setOrdered(`Đã thêm "${winner.name}" vào đơn của bạn. Quán sẽ pha ngay!`)}
                    className="mt-3 rounded-full bg-emerald-600 px-5 py-2.5 font-bold text-white hover:bg-emerald-700"
                  >
                    Gọi món này
                  </button>
                  {ordered && <p className="mt-2 text-sm font-semibold text-emerald-700">{ordered}</p>}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Tất cả món (ẩn khi đang tìm kiếm/sắp xếp/lọc, vì kết quả đã hiện ở trên) */}
        {!hasActiveFilter && (
          <>
            <h2 className="mt-8 text-xl font-bold">
              Tất cả món <span className="text-base text-emerald-700">({visible.length})</span>
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
              {visible.map((p) => (
                <ProductCard
                  key={p.id}
                  p={p}
                  rank={bestSellerRank.get(p.id) ?? 0}
                  inWheel={wheelItems.some((w) => w.id === p.id)}
                  wheelFull={wheelItems.length >= MAX_WHEEL_ITEMS}
                  onAddToWheel={addToWheel}
                />
              ))}
            </div>
            {visible.length === 0 && <p className="mt-4 text-zinc-500">Không tìm thấy món nào.</p>}
          </>
        )}

        <footer className="mt-10 border-t border-zinc-300 pt-5 text-sm text-zinc-500">
          <div className="text-base font-bold text-zinc-800">☕ Buông Coffee — Quán nước</div>
          <p className="mt-1">Số 12, đường Nguyễn Trãi, Hà Nội • Mở cửa 8:00 – 22:00 hàng ngày</p>
          <p>Giao hàng trong 30 phút • Freeship cho đơn từ 100.000đ • Hotline: 0987 980 381</p>
        </footer>
      </main>
    </div>
  );
}
