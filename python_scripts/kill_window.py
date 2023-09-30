import sys
import ctypes

hwnd = int(sys.argv[1])

# Get the process ID from the HWND
process_id = ctypes.c_ulong()
ctypes.windll.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(process_id))

# Open a handle to the process
PROCESS_TERMINATE = 0x0001
process_handle = ctypes.windll.kernel32.OpenProcess(PROCESS_TERMINATE, False, process_id)

# Call TerminateProcess to kill the process
exit_code = 0  # Replace with the exit code you want to use for the process
ctypes.windll.kernel32.TerminateProcess(process_handle, exit_code)