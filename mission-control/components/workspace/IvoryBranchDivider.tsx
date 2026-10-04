import { useId } from "react";
import "./ivory-divider.css";

/** A quiet, sculpted wood inlay at the meeting of the two dividers. */
export function IvoryBranchDivider() {
  const id = useId();
  const trunk = `${id}-trunk`;
  const bough = `${id}-bough`;
  const stem = "M29 0C24 28 29 45 30 66C31 88 25 105 26 128C27 154 35 174 34 199C33 231 26 259 28 284C30 313 33 328 33 356C32 390 31 424 32 480L32.7 480C33 420 36 385 36 356C37 326 36 304 33 282C30 260 37 229 40 199C42 171 34 149 35 128C35 103 41 87 39 64C38 42 39 21 37 0Z";
  const arm = "M0 23C21 20 35 25 52 26C74 27 91 21 112 23C138 25 151 30 176 29C201 28 226 28 254 28L254 28.7C225 29 204 32 178 33C151 35 137 30 112 30C91 30 75 36 51 35C30 34 16 31 0 34Z";

  return (
    <div className="ivory-divider" aria-hidden="true">
      <svg className="ivory-divider-stem" viewBox="0 0 64 480" preserveAspectRatio="none" focusable="false">
        <defs>
          <linearGradient id={`${trunk}-wood`} x1="0" x2="1">
            <stop stopColor="#a9a89e" />
            <stop offset=".17" stopColor="#e4e1d6" />
            <stop offset=".4" stopColor="#fffdf5" />
            <stop offset=".58" stopColor="#fff" />
            <stop offset=".77" stopColor="#ece9df" />
            <stop offset="1" stopColor="#b4b8b5" />
          </linearGradient>
          <linearGradient id={`${trunk}-fade`} x2="0" y2="1">
            <stop stopColor="black" />
            <stop offset=".06" stopColor="white" />
            <stop offset=".69" stopColor="white" />
            <stop offset="1" stopColor="black" />
          </linearGradient>
          <mask id={`${trunk}-mask`}><rect width="64" height="480" fill={`url(#${trunk}-fade)`} /></mask>
          <clipPath id={`${trunk}-grain`}><path d={stem} /></clipPath>
        </defs>
        <g mask={`url(#${trunk}-mask)`}>
          <g fill={`url(#${trunk}-wood)`} stroke="#a6a59c" strokeWidth=".35">
            <path d="M31 97C22 89 15 79 12 67C9 54 6 45 1 40C8 43 12 54 15 64C20 77 27 82 34 85Z" />
            <path d="M36 205C43 197 47 183 50 171C53 159 57 151 62 147C57 155 55 166 53 175C51 193 47 204 38 214Z" />
            <path d={stem} />
          </g>
          <g clipPath={`url(#${trunk}-grain)`} fill="none" strokeLinecap="round">
            <path d="M32 0C26 42 37 59 32 89S28 133 33 160S40 193 35 230S30 269 32 292S36 341 34 382L32.4 480" stroke="#fff" strokeWidth="1.5" opacity=".85" />
            <path d="M29 0C26 31 33 58 30 78S23 125 30 153S39 199 31 242S31 292 34 318S32 391 33 450" stroke="#acaa9e" strokeWidth=".65" opacity=".45" />
            <path d="M36 0C34 29 39 55 36 83S30 111 31 126S39 174 37 204S29 262 33 282" stroke="#d6d1c2" strokeWidth=".8" />
            <path d="M34 58C29 88 34 108 33 127C31 137 28 137 30 125C31 116 36 112 35 124C34 133 31 144 33 159" stroke="#b3ad9c" strokeWidth=".55" opacity=".6" />
            <path d="M34 65C31 87 35 105 35 112M34 140C33 151 39 172 38 183M31 251C30 264 34 282 34 294" stroke="#fff" strokeWidth=".9" />
          </g>
          <path d="M11 63C16 79 22 86 29 91M51 173C48 190 44 200 40 205" fill="none" stroke="#fffdf5" strokeWidth=".8" strokeLinecap="round" />
        </g>
      </svg>
      <svg className="ivory-divider-bough" viewBox="0 0 260 72" focusable="false">
        <defs>
          <linearGradient id={`${bough}-wood`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#b1b4ae" />
            <stop offset=".22" stopColor="#f4f1e7" />
            <stop offset=".45" stopColor="#fff" />
            <stop offset=".68" stopColor="#ece8dc" />
            <stop offset="1" stopColor="#a5a89f" />
          </linearGradient>
          <linearGradient id={`${bough}-fade`}>
            <stop offset=".6" stopColor="white" />
            <stop offset="1" stopColor="black" />
          </linearGradient>
          <mask id={`${bough}-mask`}><rect width="260" height="72" fill={`url(#${bough}-fade)`} /></mask>
          <clipPath id={`${bough}-grain`}><path d={arm} /></clipPath>
        </defs>
        <g mask={`url(#${bough}-mask)`}>
          <g fill={`url(#${bough}-wood)`} stroke="#aaa99f" strokeWidth=".35">
            <path d="M62 29C72 36 79 43 91 46C104 49 117 47 126 51C116 49 103 52 89 50C75 47 67 39 58 34Z" />
            <path d="M126 26C140 22 147 19 156 18C167 17 171 13 176 10C170 17 165 20 156 21C147 22 143 27 132 29Z" />
            <path d={arm} />
          </g>
          <g clipPath={`url(#${bough}-grain)`} fill="none" strokeLinecap="round">
            <path d="M0 27C22 25 34 29 52 30S88 24 112 26S151 33 177 31S223 28 254 28.4" stroke="#fff" strokeWidth="1.5" />
            <path d="M0 30C30 28 37 35 64 32S93 26 111 28S153 35 177 32" stroke="#b3aea1" strokeWidth=".55" opacity=".65" />
            <path d="M37 29C47 27 63 31 67 32C68 34 56 35 49 33C43 31 49 30 57 31M98 25C115 26 130 25 144 30" stroke="#d0caba" strokeWidth=".6" />
          </g>
          <path d="M68 35C81 46 90 48 105 48M141 24C154 18 165 20 173 14" fill="none" stroke="#fffdf5" strokeWidth=".8" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
