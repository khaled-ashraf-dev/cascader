import sys
import ctypes
from ctypes import wintypes
from collections import namedtuple
import win32con
import win32gui
import json


hwnds_json = json.loads(sys.argv[1])
hwnds_all = []
for hwnd_set in hwnds_json:
    data = [int(i) for i in hwnd_set]
    hwnds_all.append(data)

stackData_json = json.loads(sys.argv[2])
stackData_all = []
for stack in stackData_json:
    data = [int(i) for i in stack]
    stackData_all.append(data)


# Ctypes
SWP_NOACTIVATE = 0x0010
SWP_NOMOVE = 0x0002
SWP_NOSIZE = 0x0001
SWP_SHOWWINDOW = 0x0040


HDWP = ctypes.c_void_p
HWND = ctypes.wintypes.HWND

def begin_defer_window_pos(nNumWindows):
    user32 = ctypes.windll.user32
    return user32.BeginDeferWindowPos(nNumWindows)

def defer_window_pos(hWinPosInfo, hWnd, hWndInsertAfter, x, y, cx, cy, uFlags):
    user32 = ctypes.windll.user32
    return user32.DeferWindowPos(hWinPosInfo, hWnd, hWndInsertAfter, x, y, cx, cy, uFlags)

def end_defer_window_pos(hWinPosInfo):
    user32 = ctypes.windll.user32
    return user32.EndDeferWindowPos(hWinPosInfo)



for k in range(4):
    x = stackData_all[k][0]
    y = stackData_all[k][1]
    offsetx = stackData_all[k][2]
    offsety = stackData_all[k][3]

    hwnds = hwnds_all[k]
    
    hdwp = begin_defer_window_pos(len(hwnds))
    


    for i in range(len(hwnds)):
        hdwp = defer_window_pos(hdwp, hwnds[i], wintypes.HWND(-1), x, y, 500, 500, SWP_NOSIZE | SWP_SHOWWINDOW)
            
        x += offsetx
        y += offsety

    end_defer_window_pos(hdwp)

    x = stackData_all[k][0]
    y = stackData_all[k][1]
    offsetx = stackData_all[k][2]
    offsety = stackData_all[k][3]
    hdwp = begin_defer_window_pos(len(hwnds))

    for i in range(len(hwnds)):
        hdwp = defer_window_pos(hdwp, hwnds[i], wintypes.HWND(-2), x, y, 500, 500, SWP_NOSIZE | SWP_SHOWWINDOW)
            
        x += offsetx
        y += offsety

    end_defer_window_pos(hdwp)