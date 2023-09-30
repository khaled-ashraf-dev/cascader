import ctypes
from ctypes import wintypes
from collections import namedtuple
import subprocess
import sys
import json
import time

# Read hwnds array from command-line arguments
hwnds_json = sys.argv[1]
hwnds = [int(hwnd) for hwnd in json.loads(hwnds_json)]

name = sys.argv[2]

client = sys.argv[3]

keywords = json.loads(sys.argv[4])

batch_dir = client

with open('output.txt', 'w') as f:
    subprocess.Popen(["notepad.exe", batch_dir + name + '.txt'])
    #subprocess.call([batch_dir + name + '.txt'], stdout=f, stderr=f)


user32 = ctypes.WinDLL('user32', use_last_error=True)

def check_zero(result, func, args):    
    if not result:
        err = ctypes.get_last_error()
        if err:
            raise ctypes.WinError(err)
    return args

if not hasattr(wintypes, 'LPDWORD'): # PY2
    wintypes.LPDWORD = ctypes.POINTER(wintypes.DWORD)

WindowInfo = namedtuple('WindowInfo', 'pid title')

WNDENUMPROC = ctypes.WINFUNCTYPE(
    wintypes.BOOL,
    wintypes.HWND,
    wintypes.LPARAM)

user32.EnumWindows.errcheck = check_zero
user32.EnumWindows.argtypes = (
   WNDENUMPROC,
   wintypes.LPARAM,)

user32.IsWindowVisible.argtypes = (
    wintypes.HWND,)

user32.GetWindowThreadProcessId.restype = wintypes.DWORD
user32.GetWindowThreadProcessId.argtypes = (
  wintypes.HWND,
  wintypes.LPDWORD,)

user32.GetWindowTextLengthW.errcheck = check_zero
user32.GetWindowTextLengthW.argtypes = (
   wintypes.HWND,)

user32.GetWindowTextW.errcheck = check_zero
user32.GetWindowTextW.argtypes = (
    wintypes.HWND,
    wintypes.LPWSTR,
    ctypes.c_int,)

time.sleep(0.15)
titles = []
def get_window_info(hwnd, lparam):
    if user32.IsWindowVisible(hwnd):
        pid = wintypes.DWORD()
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        buf_size = user32.GetWindowTextLengthW(hwnd) + 1
        title = ctypes.create_unicode_buffer(buf_size)
        user32.GetWindowTextW(hwnd, title, buf_size)
        info = WindowInfo(pid=pid.value, title=title.value)
        if 'txt' in title.value:
            titles.append(title.value)
    return True

user32.EnumWindows(WNDENUMPROC(get_window_info), 0)


substrings = keywords

for i in titles:
    hwnd = ctypes.windll.user32.FindWindowW(None, i)
    if hwnd is not None and hwnd not in hwnds and any(substring in i for substring in substrings):
        print(hwnd)
        break