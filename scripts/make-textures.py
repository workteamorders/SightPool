# Renders the two tileable grain textures in public/ from code (no stock or AI art): grain-dark.png (light specks
# for the dark room) and grain-paper.png (aged blotches, fibres and specks for sheets). Fixed seed, so the output
# is reproducible. Run: python3 scripts/make-textures.py
import pathlib
import numpy as np
from PIL import Image

root = pathlib.Path(__file__).resolve().parent.parent
N = 256
rng = np.random.default_rng(4663)


def blur_tile(a, sigma):
    """Gaussian blur by FFT, so the result wraps and the tile has no seam."""
    f = np.fft.fftfreq(a.shape[0])[:, None] ** 2 + np.fft.fftfreq(a.shape[1])[None, :] ** 2
    return np.real(np.fft.ifft2(np.fft.fft2(a) * np.exp(-2 * (np.pi * sigma) ** 2 * f)))


def norm(a):
    return (a - a.min()) / (a.max() - a.min() + 1e-9)


# Dark room: fine light specks, a few brighter ones.
fine = rng.random((N, N))
specks = (fine > 0.985) * rng.random((N, N))
alpha = np.clip(fine * 9 + specks * 40, 0, 255).astype(np.uint8)
dark = np.zeros((N, N, 4), np.uint8)
dark[..., :3] = 236
dark[..., 3] = alpha
Image.fromarray(dark, "RGBA").save(root / "public/grain-dark.png", optimize=True)

# Paper: low-frequency blotches (age), mid grain, fibres, dark specks. Warm brown ink on transparent.
blot = norm(blur_tile(rng.random((N, N)), 18))
mid = norm(blur_tile(rng.random((N, N)), 1.2))
fib = np.zeros((N, N))
for _ in range(220):
    x, y = rng.integers(0, N, 2)
    ang = rng.random() * np.pi
    length = rng.integers(6, 22)
    for t in range(length):
        fib[int(y + np.sin(ang) * t) % N, int(x + np.cos(ang) * t) % N] = 1
dots = (rng.random((N, N)) > 0.992) * rng.random((N, N))
a = blot * 26 + mid * 14 + fib * 14 + dots * 60
paper = np.zeros((N, N, 4), np.uint8)
paper[..., 0], paper[..., 1], paper[..., 2] = 92, 70, 34
paper[..., 3] = np.clip(a, 0, 255).astype(np.uint8)
Image.fromarray(paper, "RGBA").save(root / "public/grain-paper.png", optimize=True)
print("wrote public/grain-dark.png and public/grain-paper.png")
