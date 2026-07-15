
# Chơi game thông qua những dòng chat của live stream của youtube
# Đây chỉ là bản demo (bởi chatgpt)

import pytchat
import pyautogui

actions = {
    "up": "w",
    "down": "s",
    "left": "a",
    "right": "d",
    "jump": "space",
}

def get_comments(video_id):
    chat = pytchat.create(video_id=video_id)
    while chat.is_alive():
        for c in chat.get().sync_items():
            action = c.message.lower().strip()
            perform_action(action)

def perform_action(action):
    if action in actions:
        pyautogui.press(actions[action])

if __name__ == "__main__":
    video_id = "your_video_id_here"
    get_comments(video_id)
