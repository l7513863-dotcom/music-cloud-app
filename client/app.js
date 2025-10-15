document.addEventListener('DOMContentLoaded', () => {
  // 确保所有必需元素都存在
  const requiredElements = [
    'uploadForm', 'songList', 'player', 
    'audioPlayer', 'playBtn', 'pauseBtn', 'prevBtn', 'nextBtn',
    'progressBar', 'currentTime', 'duration', 'fileInput',
    'nowPlayingTitle', 'nowPlayingArtist', 'songCount'
  ];
  
  const missingElements = requiredElements.filter(id => !document.getElementById(id));
  if (missingElements.length > 0) {
    console.error('缺少必需元素:', missingElements.join(', '));
    return;
  }
  
  // 获取DOM元素
  const uploadForm = document.getElementById('uploadForm');
  const songList = document.getElementById('songList');
  const player = document.getElementById('player');
  const audioPlayer = document.getElementById('audioPlayer');
  const playBtn = document.getElementById('playBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const volumeBtn = document.getElementById('volumeBtn');
  const progressBar = document.getElementById('progressBar');
  const currentTimeDisplay = document.getElementById('currentTime');
  const durationDisplay = document.getElementById('duration');
  const fileInput = document.getElementById('fileInput');
  const uploadContent = document.getElementById('uploadContent');
  const fileName = document.getElementById('fileName');
  const nowPlayingTitle = document.getElementById('nowPlayingTitle');
  const nowPlayingArtist = document.getElementById('nowPlayingArtist');
  const songCount = document.getElementById('songCount');
  const emptyState = document.getElementById('emptyState');
  const loadingIndicator = document.getElementById('loading');
  const currentTimeDisplayGlobal = document.getElementById('currentTimeDisplay');
  const searchInput = document.getElementById('searchInput');

  // 音量控制相关
  let isVolumeControlVisible = false;
  let volumeControl = document.getElementById('volumeControl');
  
  if (!volumeControl) {
    volumeControl = document.createElement('div');
    volumeControl.id = 'volumeControl';
    volumeControl.className = 'absolute bottom-full mb-2 left-0 bg-white p-4 rounded-xl shadow-xl z-50 opacity-0 transform scale-95 transition-all duration-300 pointer-events-none';
    volumeControl.innerHTML = `
      <div class="flex items-center space-x-3">
        <i class="fas fa-volume-down text-gray-500 text-sm"></i>
        <input type="range" id="volumeSlider" min="0" max="1" step="0.1" value="${audioPlayer.volume}" 
               class="w-32 h-2 bg-gray-300 rounded-full appearance-none cursor-pointer volume-slider">
        <i class="fas fa-volume-up text-gray-500 text-sm"></i>
      </div>
    `;
    volumeBtn.parentNode.style.position = 'relative';
    volumeBtn.parentNode.appendChild(volumeControl);
  }
  
  const volumeSlider = document.getElementById('volumeSlider');

  // 文件上传交互
  uploadContent.addEventListener('click', () => fileInput.click());
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      uploadContent.classList.add('hidden');
      fileName.textContent = `已选择: ${file.name}`;
      fileName.classList.remove('hidden');
    }
  });

  // 更新进度条和时间显示
  audioPlayer.addEventListener('timeupdate', () => {
    const currentTime = audioPlayer.currentTime;
    const duration = audioPlayer.duration;
    
    if (duration > 0) {
      progressBar.value = (currentTime / duration) * 100;
      currentTimeDisplay.textContent = formatTime(currentTime);
      durationDisplay.textContent = formatTime(duration);
    }
    
    // 更新导航栏时间显示
    updateCurrentTime();
  });

  audioPlayer.addEventListener('loadedmetadata', () => {
    if (audioPlayer.duration > 0) {
      durationDisplay.textContent = formatTime(audioPlayer.duration);
    }
  });

  // 点击进度条跳转
  progressBar.addEventListener('input', () => {
    const seekTime = (progressBar.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = seekTime;
  });

  // 音量控制
  volumeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleVolumeControl();
  });

  // 点击其他地方隐藏音量控制
  document.addEventListener('click', (e) => {
    if (isVolumeControlVisible && !volumeControl.contains(e.target) && e.target !== volumeBtn) {
      hideVolumeControl();
    }
  });

  // 防止音量控制内部点击触发隐藏
  volumeControl.addEventListener('click', (e) => e.stopPropagation());

  // 音量滑块事件
  volumeSlider.addEventListener('input', (e) => {
    audioPlayer.volume = parseFloat(e.target.value);
    updateVolumeIcon();
  });

  // 音量控制显示/隐藏函数
  function toggleVolumeControl() {
    if (isVolumeControlVisible) {
      hideVolumeControl();
    } else {
      showVolumeControl();
    }
  }

  function showVolumeControl() {
    isVolumeControlVisible = true;
    volumeControl.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
    volumeControl.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
  }

  function hideVolumeControl() {
    isVolumeControlVisible = false;
    volumeControl.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
    volumeControl.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
  }

  // 更新音量图标
  function updateVolumeIcon() {
    const volume = audioPlayer.volume;
    const icon = volumeBtn.querySelector('i');
    
    if (volume === 0) {
      icon.className = 'fas fa-volume-mute';
    } else if (volume < 0.5) {
      icon.className = 'fas fa-volume-down';
    } else {
      icon.className = 'fas fa-volume-up';
    }
  }

  // 播放/暂停控制
  playBtn.addEventListener('click', () => {
    if (audioPlayer.src) {
      const playPromise = audioPlayer.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error('播放失败:', err);
          showNotification('播放失败: ' + err.message, 'error');
        });
      }
      updatePlayPauseButtons();
    }
  });
  
  pauseBtn.addEventListener('click', () => {
    audioPlayer.pause();
    updatePlayPauseButtons();
  });

  // 上一首/下一首控制
  prevBtn.addEventListener('click', debounce(playPreviousSong, 300));
  nextBtn.addEventListener('click', debounce(playNextSong, 300));

  // 音频播放状态变化
  audioPlayer.addEventListener('play', updatePlayPauseButtons);
  audioPlayer.addEventListener('pause', updatePlayPauseButtons);

  // 防抖函数
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
  }

  // 格式化时间显示
  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // 性能优化：延迟加载非关键资源
  function loadCriticalResources() {
    const lazyLoad = () => {
      // 延迟加载字体和图标
      const fontAwesome = document.createElement('link');
      fontAwesome.rel = 'stylesheet';
      fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(fontAwesome);
    };
    
    if (document.readyState === 'complete') {
      setTimeout(lazyLoad, 1000);
    } else {
      window.addEventListener('load', () => {
        setTimeout(lazyLoad, 1000);
      });
    }
  }

  // 初始化时调用
  loadCriticalResources();

  // 更新播放/暂停按钮状态
  function updatePlayPauseButtons() {
    if (audioPlayer.paused) {
      playBtn.classList.remove('hidden');
      pauseBtn.classList.add('hidden');
    } else {
      playBtn.classList.add('hidden');
      pauseBtn.classList.remove('hidden');
    }
  }

  // 更新当前时间显示
  function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('zh-CN', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    currentTimeDisplayGlobal.textContent = timeString;
  }

  // 播放上一首
  function playPreviousSong() {
    if (playerState.currentIndex > 0) {
      playerState.currentIndex--;
      playSong(playerState.songList[playerState.currentIndex]);
    }
  }

  // 播放下一首
  function playNextSong() {
    if (playerState.currentIndex < playerState.songList.length - 1) {
      playerState.currentIndex++;
      playSong(playerState.songList[playerState.currentIndex]);
    }
  }

  // 检测浏览器扩展干扰
  const isExtensionInterference = () => {
    return (window.chrome && chrome.runtime && chrome.runtime.id) || 
           navigator.userAgent.includes('Extension');
  };
  
  // 全局状态
  const playerState = {
    songList: [],
    currentIndex: -1
  };

  // 初始化当前时间显示
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  // 终极版带超时和重试的fetch请求
  function fetchWithRetry(url, options = {}, retries = 3, timeout = 5000) {
    loadingIndicator.classList.remove('hidden');
    
    if (isExtensionInterference()) {
      console.warn('警告: 检测到可能干扰请求的浏览器扩展');
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`请求超时，请检查: 1.网络连接 2.浏览器扩展 3.防火墙设置`));
      }, timeout);

      const attempt = (n) => {
        fetch(url, options)
          .then(res => {
            clearTimeout(timer);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .then(resolve)
          .catch(err => {
            clearTimeout(timer);
            if (n > 0 && !err.message.includes('Extension')) {
              console.warn(`请求失败，${n}次重试剩余...`, err);
              setTimeout(() => attempt(n - 1), 1000);
            } else {
              reject(new Error(`${err.message}
解决方案:
1. 临时禁用广告拦截器
2. 尝试使用无痕模式
3. 更换浏览器`));
            }
          });
      };
      attempt(retries);
    });
  }

  // 播放歌曲函数
  function playSong(song, retryCount = 0) {
    console.log('准备播放:', song.title);
    
    // 修复文件路径：将反斜杠转换为正斜杠
    const filePath = song.file_path.replace(/\\/g, '/');
    console.log('设置播放源:', filePath);
    
    // 如果当前正在播放同一首歌，直接返回
    if (audioPlayer.src.endsWith(filePath) && !audioPlayer.paused) {
      return;
    }
    
    // 更新当前播放信息
    nowPlayingTitle.textContent = song.title || '未知歌曲';
    nowPlayingArtist.textContent = song.artist || '未知艺术家';
    
    // 重置音频并设置新源
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    audioPlayer.src = filePath;
    player.classList.remove('hidden');
    
    // 清除之前的错误和事件监听器
    audioPlayer.onerror = null;
    audioPlayer.oncanplaythrough = null;
    
    // 设置错误处理
    audioPlayer.onerror = function() {
      console.error('音频加载错误:', audioPlayer.error);
      if (retryCount < 2) {
        console.log(`尝试重新加载 (${retryCount + 1}/3)`);
        setTimeout(() => playSong(song, retryCount + 1), 1000);
      } else {
        showNotification('音频加载失败，请检查网络连接', 'error');
      }
    };
    
    // 等待音频可以播放时再尝试播放
    audioPlayer.oncanplaythrough = function() {
      console.log('音频可以播放，开始播放:', song.title);
      const playPromise = audioPlayer.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('播放成功:', song.title);
            updatePlayPauseButtons();
          })
          .catch(err => {
            console.error('播放失败:', err);
            if (err.name !== 'AbortError') {
              if (retryCount < 2) {
                console.log(`尝试重新播放 (${retryCount + 1}/3)`);
                setTimeout(() => playSong(song, retryCount + 1), 1000);
              } else {
                showNotification('播放失败: ' + err.message, 'error');
              }
            }
          });
      }
    };
    
    // 加载音频
    audioPlayer.load();
  }

  function handleSongEnded() {
    console.log('歌曲播放结束，当前索引:', playerState.currentIndex, '列表长度:', playerState.songList.length);
    
    // 检查索引有效性
    if (playerState.currentIndex === -1) {
      console.log('无效索引，尝试从第一首开始');
      if (playerState.songList.length > 0) {
        playerState.currentIndex = 0;
        return playSong(playerState.songList[0]);
      }
    }
    
    // 正常播放下一首
    if(playerState.currentIndex >= 0 && 
       playerState.currentIndex < playerState.songList.length - 1) {
      const nextIndex = playerState.currentIndex + 1;
      console.log('准备播放下一首，索引:', nextIndex);
      playerState.currentIndex = nextIndex;
      playSong(playerState.songList[nextIndex]);
    } else {
      console.log('播放列表结束');
      player.classList.add('hidden');
    }
  }

  // 获取音乐列表
  console.log('开始获取歌曲列表...');
  fetchWithRetry('/api/songs')
    .then(songs => {
      console.log('获取到的歌曲数据:', songs);
      if (!Array.isArray(songs)) {
        console.error('返回数据格式错误，期望数组:', songs);
        throw new Error('服务器返回数据格式不正确');
      }
      
      playerState.songList = songs;
      console.log('成功设置歌曲列表，数量:', songs.length);
      
      // 设置播放结束监听
      audioPlayer.addEventListener('ended', handleSongEnded);

      // 更新歌曲数量
      songCount.textContent = songs.length;
      
      // 渲染歌曲列表
      if (songs.length === 0) {
        emptyState.classList.remove('hidden');
        songList.classList.add('hidden');
        console.log('显示空列表提示');
      } else {
        emptyState.classList.add('hidden');
        songList.classList.remove('hidden');
        console.log('开始渲染歌曲列表');

        const fragment = document.createDocumentFragment();
        
        songs.forEach((song, index) => {
          if (!song.id || !song.title) {
            console.warn('无效的歌曲数据:', song);
            return;
          }
          
          const li = document.createElement('li');
          li.className = 'song-card bg-white/10 backdrop-blur-sm rounded-lg p-4';
          li.innerHTML = `
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4 flex-1 min-w-0">
                <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white font-semibold text-sm">${index + 1}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-white font-semibold truncate">${song.title || '未知歌曲'}</h3>
                  <p class="text-blue-100 text-sm truncate">${song.artist || '未知艺术家'}</p>
                </div>
              </div>
              <button class="play-btn bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300" 
                      data-id="${song.id}">
                <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>
                  </svg>
                  <span>播放</span>
                </div>
              </button>
            </div>
          `;
          fragment.appendChild(li);
        });
        
        songList.innerHTML = '';
        songList.appendChild(fragment);
        console.log('歌曲列表渲染完成');
        
        // 在歌曲列表渲染完成后注册播放按钮事件监听器
        songList.addEventListener('click', (e) => {
          const playBtn = e.target.closest('.play-btn');
          if (playBtn) {
            const songId = parseInt(playBtn.getAttribute('data-id'));
            const song = playerState.songList.find(s => s.id === songId);
            if (song) {
              const newIndex = playerState.songList.findIndex(s => s.id === songId);
              if (newIndex >= 0) {
                playerState.currentIndex = newIndex;
                console.log('设置当前播放索引:', newIndex);
                playSong(song);
              } else {
                console.error('找不到歌曲索引:', songId);
              }
            }
          }
        });
      }
    })
    .catch(err => {
      console.error('获取歌曲列表失败:', err);
      songList.innerHTML = `
        <li class="p-4 text-red-500">
          加载失败: ${err.message}
          <div class="mt-2 text-sm">
            建议: 1.刷新页面 2.检查控制台 3.联系管理员
          </div>
        </li>
      `;
    })
    .finally(() => {
      loadingIndicator.classList.add('hidden');
    });

  // 上传音乐
  uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(uploadForm);
    const submitBtn = uploadForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // 验证文件是否已选择
    if (!fileInput.files.length) {
      alert('请选择要上传的音频文件');
      return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = '上传中...';
    submitBtn.classList.add('pulse-animation');
    loadingIndicator.classList.remove('hidden');

    fetch('/api/songs', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      // 显示成功提示
      showNotification('上传成功!', 'success');
      
      // 重置表单
      uploadForm.reset();
      uploadContent.classList.remove('hidden');
      fileName.classList.add('hidden');
      
      // 重新加载歌曲列表
      loadSongs();
    })
    .catch(err => {
      console.error('上传失败:', err);
      showNotification('上传失败: ' + err.message, 'error');
    })
    .finally(() => {
      loadingIndicator.classList.add('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      submitBtn.classList.remove('pulse-animation');
    });
  });

  // 显示通知
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
      type === 'success' ? 'bg-green-500 text-white' : 
      type === 'error' ? 'bg-red-500 text-white' : 
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // 使用事件委托处理播放按钮点击
  function handleSongListClick(e) {
    const playBtn = e.target.closest('.play-btn');
    if (playBtn) {
      const songId = parseInt(playBtn.getAttribute('data-id'));
      const song = playerState.songList.find(s => s.id === songId);
      if (song) {
        const newIndex = playerState.songList.findIndex(s => s.id === songId);
        if (newIndex >= 0) {
          playerState.currentIndex = newIndex;
          playSong(song);
        }
      }
    }
  }

  // 初始化歌曲列表点击事件（只绑定一次）
  songList.addEventListener('click', handleSongListClick);

  // 优化后的歌曲列表加载
  function loadSongs() {
    // 使用requestIdleCallback优化非关键任务
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        performLoadSongs();
      }, { timeout: 1000 });
    } else {
      performLoadSongs();
    }
  }

  function performLoadSongs() {
    loadingIndicator.classList.remove('hidden');
    emptyState.classList.add('hidden');
    songList.classList.add('hidden');
    
    // 使用AbortController控制请求
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    fetchWithRetry('/api/songs', { signal: controller.signal })
      .finally(() => clearTimeout(timeoutId))
      .then(songs => {
        console.log('获取到的歌曲数据:', songs);
        if (!Array.isArray(songs)) {
          console.error('返回数据格式错误，期望数组:', songs);
          throw new Error('服务器返回数据格式不正确');
        }
        
        playerState.songList = songs;
        console.log('成功设置歌曲列表，数量:', songs.length);
        
        // 更新歌曲数量
        songCount.textContent = songs.length;
        
        // 渲染歌曲列表
        if (songs.length === 0) {
          emptyState.classList.remove('hidden');
        } else {
          songList.classList.remove('hidden');
          
          const fragment = document.createDocumentFragment();
          
          songs.forEach((song, index) => {
            if (!song.id || !song.title) {
              console.warn('无效的歌曲数据:', song);
              return;
            }
            
            const li = document.createElement('li');
            li.className = 'song-card bg-white/10 backdrop-blur-sm rounded-lg p-4';
            li.innerHTML = `
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4 flex-1 min-w-0">
                  <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span class="text-white font-semibold text-sm">${index + 1}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-white font-semibold truncate">${song.title || '未知歌曲'}</h3>
                    <p class="text-blue-100 text-sm truncate">${song.artist || '未知艺术家'}</p>
                  </div>
                </div>
                <button class="play-btn bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300" 
                        data-id="${song.id}">
                  <div class="flex items-center space-x-2">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>
                    </svg>
                    <span>播放</span>
                  </div>
                </button>
              </div>
            `;
            fragment.appendChild(li);
          });
          
          songList.innerHTML = '';
          songList.appendChild(fragment);
        }
      })
      .catch(err => {
        console.error('获取歌曲列表失败:', err);
        showNotification('加载失败: ' + err.message, 'error');
        emptyState.classList.remove('hidden');
      })
      .finally(() => {
        loadingIndicator.classList.add('hidden');
      });
  }
});