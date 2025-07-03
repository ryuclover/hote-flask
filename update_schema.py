import sqlite3

# Path to your SQLite database
db_path = 'c:\\Users\\gabri.RYU\\OneDrive\\Área de Trabalho\\teste-flask\\events.db'

# Connect to the database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Add the 'cover_image' column to the 'event' table
try:
    cursor.execute("ALTER TABLE event ADD COLUMN cover_image TEXT")
    print("Column 'cover_image' added successfully.")
except sqlite3.OperationalError as e:
    print(f"Error: {e}")

# Close the connection
conn.commit()
conn.close()
