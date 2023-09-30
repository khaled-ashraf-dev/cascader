import ctypes
import sys
import json

hwnds = [int(arg) for arg in sys.argv[1:]]

for hwnd in hwnds:
    result = ctypes.windll.user32.IsWindow(hwnd)
    if result == 0 and hwnd != -1:
        print(hwnd)
        break