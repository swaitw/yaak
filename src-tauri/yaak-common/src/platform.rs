pub fn get_os() -> &'static str {
    if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else {
        "unknown"
    }
}

pub fn get_ua_platform() -> &'static str {
    if cfg!(target_os = "windows") {
        "Win"
    } else if cfg!(target_os = "macos") {
        "Mac"
    } else if cfg!(target_os = "linux") {
        "Linux"
    } else {
        "Unknown"
    }
}

pub fn get_ua_arch() -> &'static str {
    if cfg!(target_arch = "x86_64") {
        "x86_64"
    } else if cfg!(target_arch = "x86") {
        "i386"
    } else if cfg!(target_arch = "arm") {
        "ARM"
    } else if cfg!(target_arch = "aarch64") {
        "ARM64"
    } else {
        "Unknown"
    }}
