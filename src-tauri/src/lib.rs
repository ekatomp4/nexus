// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
// #[tauri::command]
// fn greet(name: &str) -> String {
//     format!("Hello, {}! You've been greeted from Rust!", name)
// }

use std::process::{Command, Stdio};
use std::io::{BufReader, BufRead};

fn open_node_server(mode: &str) {
    let npm_cmd = match mode {
        "dev" => "npm run dev",   // nodemon
        "start" => "npm start",   // production
        _ => {
            eprintln!("[Server-ERR] Invalid mode: {}", mode);
            return;
        }
    };

    let mut child = Command::new("cmd")
        .current_dir("server") // change working dir to project root
        .args(["/C", npm_cmd])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("failed to start node server");

    // Pipe stdout
    if let Some(stdout) = child.stdout.take() {
        let reader = BufReader::new(stdout);
        std::thread::spawn(move || {
            for line in reader.lines() {
                if let Ok(line) = line {
                    println!("[Server] {}", line);
                }
            }
        });
    }

    // Pipe stderr
    if let Some(stderr) = child.stderr.take() {
        let reader = BufReader::new(stderr);
        std::thread::spawn(move || {
            for line in reader.lines() {
                if let Ok(line) = line {
                    eprintln!("[Server-ERR] {}", line);
                }
            }
        });
    }
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // print immediately
    open_node_server("dev");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
