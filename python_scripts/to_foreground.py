import ctypes
import ctypes.wintypes as wintypes
import sys

# Import necessary functions and constants from user32.dll
user32 = ctypes.windll.user32
HWND_TOPMOST = -1
SWP_NOMOVE = 0x0002
SWP_NOSIZE = 0x0001
SWP_SHOWWINDOW = 0x0040


hwnd = int(sys.argv[1])

def get_window_rect(hwnd):
    rect = wintypes.RECT()
    user32.GetWindowRect(hwnd, ctypes.byref(rect))
    return rect.left, rect.top, rect.right, rect.bottom

x, y, _, _ = get_window_rect(hwnd)

user32.SetWindowPos(hwnd, wintypes.HWND(-1), x, y, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW)
user32.SetWindowPos(hwnd, wintypes.HWND(-2), x, y, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW)