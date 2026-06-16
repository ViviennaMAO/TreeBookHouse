"""Generate tabBar PNG icons for TreeBookHouse.

Two icons: 书架 (shelf, three book spines) and 我的 (person, head + shoulders).
Two states each: inactive (gray #9CA3AF) and active (ink #0F1B3B).

Style: line-art, monochrome, transparent background, 81x81 px (WeChat recommended).
"""

from PIL import Image, ImageDraw

SIZE = 81  # WeChat tabBar icon recommended size
INACTIVE = (156, 163, 175, 255)   # #9CA3AF gray
ACTIVE   = (15, 27, 59, 255)      # #0F1B3B ink

def draw_shelf(color):
    """Three vertical book spines of varying heights, echoing the hero brand mark."""
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = SIZE // 2
    cy = SIZE // 2
    # Three spines, centered, varying heights
    spines = [
        (-18, 36),  # x_offset, height
        (-4,  44),
        ( 12, 30),
        ( 24, 38),
    ]
    w = 6
    bottom = cy + 22
    for ox, h in spines:
        x0 = cx + ox
        d.rounded_rectangle(
            [(x0, bottom - h), (x0 + w, bottom)],
            radius=2,
            fill=color,
        )
    return img

def draw_person(color):
    """Head (circle outline) + shoulders (arc)."""
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = SIZE // 2
    # Head circle outline
    r = 13
    head_cy = 28
    d.ellipse(
        [(cx - r, head_cy - r), (cx + r, head_cy + r)],
        outline=color,
        width=4,
    )
    # Shoulders / body arc — a partial ellipse opening downward
    body_top = head_cy + r + 4
    body_w = 44
    body_h = 36
    # We draw an arc from 200deg to 340deg (top half of an ellipse below head)
    d.arc(
        [(cx - body_w // 2, body_top), (cx + body_w // 2, body_top + body_h)],
        start=200, end=340,
        fill=color, width=4,
    )
    return img

def save(img, name):
    path = f"/Users/vivienna/Desktop/VibeCoding/TreeBookHouse/mini-program/images/{name}"
    img.save(path, "PNG", optimize=True)
    print(f"  wrote {name}  ({img.size[0]}x{img.size[1]})")

print("Generating tabBar icons...")
save(draw_shelf(INACTIVE), "tab_shelf.png")
save(draw_shelf(ACTIVE),   "tab_shelf_active.png")
save(draw_person(INACTIVE), "tab_me.png")
save(draw_person(ACTIVE),   "tab_me_active.png")
print("Done.")
