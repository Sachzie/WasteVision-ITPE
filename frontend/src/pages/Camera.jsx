import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'

function Camera({ onCapture, isActive, onClose }) {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [capturedSnapshot, setCapturedSnapshot] = useState(null)
  const [isCropping, setIsCropping] = useState(false)
  const [cropBox, setCropBox] = useState({ x: 15, y: 15, width: 70, height: 70 }) // percentage-based
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeCorner, setResizeCorner] = useState(null)
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const cropCanvasRef = useRef(null)
  const streamRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  useEffect(() => {
    if (isActive && !isCameraActive) {
      startCamera()
    }
  }, [isActive])



const startCamera = async () => {
  try {
    console.log('🎥 Starting camera...')
    setCameraError(null)
    
    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = 'Camera not supported in this browser. Please use Chrome, Edge, or Firefox.'
      setCameraError(errorMsg)
      toast.error(errorMsg, { duration: 5000 })
      return
    }

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    // Wait for video element to be ready
    await new Promise(resolve => setTimeout(resolve, 100))

    if (!videoRef.current) {
      const errorMsg = 'Video element not ready. Please try again.'
      setCameraError(errorMsg)
      toast.error(errorMsg, { duration: 3000 })
      return
    }

    // Request camera access
    const constraints = {
      video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        facingMode: 'user'
      },
      audio: false
    }

    console.log('📹 Requesting camera access...')
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    
    console.log('✅ Stream obtained:', stream.getTracks().map(t => ({
      label: t.label,
      enabled: t.enabled,
      readyState: t.readyState
    })))
    
    // Check if video element still exists
    if (!videoRef.current) {
      stream.getTracks().forEach(track => track.stop())
      toast.error('Video element disappeared. Please try again.')
      return
    }

    // Set stream
    videoRef.current.srcObject = stream
    streamRef.current = stream

    // Wait for video to be ready
    await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        console.error('❌ Video ready timeout')
        reject(new Error('Video initialization timeout'))
      }, 15000)

      const checkReady = () => {
        if (!videoRef.current) {
          clearTimeout(timeoutId)
          reject(new Error('Video element is null'))
          return
        }

        // Check if video is ready to play
        if (videoRef.current.readyState >= 3) { // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
          console.log('✅ Video ready:', {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight,
            readyState: videoRef.current.readyState
          })
          clearTimeout(timeoutId)
          resolve()
        }
      }

      // Listen for multiple events
      videoRef.current.addEventListener('loadedmetadata', checkReady)
      videoRef.current.addEventListener('loadeddata', checkReady)
      videoRef.current.addEventListener('canplay', checkReady)

      videoRef.current.onerror = (e) => {
        console.error('❌ Video error:', e)
        clearTimeout(timeoutId)
        reject(new Error('Video element error'))
      }

      // Check immediately in case it's already ready
      checkReady()
    })

    console.log('▶️ Playing video...')
    
    // Play video
    try {
      await videoRef.current.play()
      console.log('✅ Video playing successfully!')
      setIsCameraActive(true)
      setCameraError(null)
      toast.success('📹 Camera started successfully!', { duration: 2000 })
    } catch (playError) {
      console.error('❌ Play error:', playError)
      throw new Error(`Failed to play video: ${playError.message}`)
    }

  } catch (error) {
    console.error('❌ Camera access error:', error)
    
    let errorMessage = 'Failed to access camera.'
    let errorDetails = error.message
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage = '🚫 Camera permission denied'
      errorDetails = 'Please allow camera access in your browser settings and refresh the page.'
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorMessage = '📷 No camera found'
      errorDetails = 'Please ensure a camera is connected to your device.'
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errorMessage = '🔒 Camera is already in use'
      errorDetails = 'Please close other apps using the camera (Teams, Zoom, Skype, etc.).'
    } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
      errorMessage = '⚙️ Camera constraints not supported'
      errorDetails = 'Your camera doesn\'t support the requested settings. Trying again...'
    } else if (error.message.includes('timeout')) {
      errorMessage = '⏱️ Camera initialization timeout'
      errorDetails = 'Your camera is taking too long to respond. Please refresh and try again.'
    }
    
    setCameraError(`${errorMessage}\n\n${errorDetails}`)
    toast.error(errorMessage, { duration: 6000 })
    
    // Cleanup on error
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }
}


  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
    setCameraError(null)
  }

  // Take snapshot for cropping
const takeSnapshot = useCallback(() => {
  if (!videoRef.current || !canvasRef.current) {
    toast.error('Camera not ready')
    return
  }

  const video = videoRef.current
  const canvas = canvasRef.current
  
  if (video.paused || video.ended || video.readyState < 2) {
    toast.error('Video not ready.')
    return
  }
  
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  const context = canvas.getContext('2d')
  
  // Draw unmirrored image
  context.save()
  context.scale(-1, 1)
  context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
  context.restore()
  
  const imageUrl = canvas.toDataURL('image/jpeg', 0.92)
  setCapturedSnapshot(imageUrl)
  setIsCropping(true)
  
  // LARGER default crop box to show full image clearly
  setCropBox({ x: 5, y: 5, width: 90, height: 90 })
  
  toast.success('📸 Snapshot taken! Adjust the crop box and click "Crop & Use"', { duration: 3000 })
}, [])



  // Handle crop box dragging
  const handleMouseDown = (e, corner = null) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (corner) {
      setIsResizing(true)
      setResizeCorner(corner)
    } else {
      setIsDragging(true)
    }
    
    const rect = containerRef.current.getBoundingClientRect()
    setDragStart({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    })
  }

  const handleMouseMove = useCallback((e) => {
    if (!isDragging && !isResizing) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = ((e.clientX - rect.left) / rect.width) * 100
    const mouseY = ((e.clientY - rect.top) / rect.height) * 100
    
    if (isDragging) {
      const deltaX = mouseX - dragStart.x
      const deltaY = mouseY - dragStart.y
      
      setCropBox(prev => {
        let newX = prev.x + deltaX
        let newY = prev.y + deltaY
        
        // Boundary checks
        newX = Math.max(0, Math.min(newX, 100 - prev.width))
        newY = Math.max(0, Math.min(newY, 100 - prev.height))
        
        return { ...prev, x: newX, y: newY }
      })
      
      setDragStart({ x: mouseX, y: mouseY })
    } else if (isResizing) {
      setCropBox(prev => {
        let newBox = { ...prev }
        const minSize = 10 // minimum 10%
        
        if (resizeCorner === 'se') {
          newBox.width = Math.max(minSize, Math.min(mouseX - prev.x, 100 - prev.x))
          newBox.height = Math.max(minSize, Math.min(mouseY - prev.y, 100 - prev.y))
        } else if (resizeCorner === 'sw') {
          const newWidth = Math.max(minSize, (prev.x + prev.width) - mouseX)
          newBox.x = Math.max(0, (prev.x + prev.width) - newWidth)
          newBox.width = newWidth
          newBox.height = Math.max(minSize, Math.min(mouseY - prev.y, 100 - prev.y))
        } else if (resizeCorner === 'ne') {
          newBox.width = Math.max(minSize, Math.min(mouseX - prev.x, 100 - prev.x))
          const newHeight = Math.max(minSize, (prev.y + prev.height) - mouseY)
          newBox.y = Math.max(0, (prev.y + prev.height) - newHeight)
          newBox.height = newHeight
        } else if (resizeCorner === 'nw') {
          const newWidth = Math.max(minSize, (prev.x + prev.width) - mouseX)
          const newHeight = Math.max(minSize, (prev.y + prev.height) - mouseY)
          newBox.x = Math.max(0, (prev.x + prev.width) - newWidth)
          newBox.y = Math.max(0, (prev.y + prev.height) - newHeight)
          newBox.width = newWidth
          newBox.height = newHeight
        }
        
        return newBox
      })
    }
  }, [isDragging, isResizing, dragStart, resizeCorner])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeCorner(null)
  }, [])

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

 

  // Crop and finalize
const applyCrop = useCallback(() => {
  if (!capturedSnapshot || !cropCanvasRef.current) {
    toast.error('No snapshot to crop')
    return
  }

  const img = new Image()
  img.onload = () => {
    try {
      const canvas = cropCanvasRef.current
      const cropX = (cropBox.x / 100) * img.width
      const cropY = (cropBox.y / 100) * img.height
      const cropWidth = (cropBox.width / 100) * img.width
      const cropHeight = (cropBox.height / 100) * img.height
      
      console.log('🔍 Crop Calculations:', {
        imageSize: `${img.width}x${img.height}`,
        cropBox: cropBox,
        cropPixels: `x:${cropX}, y:${cropY}, w:${cropWidth}, h:${cropHeight}`
      })
      
      // Calculate optimal output size (maintain aspect ratio, min 640px)
      const aspectRatio = cropWidth / cropHeight
      let outputWidth, outputHeight
      
      if (aspectRatio > 1) {
        outputWidth = Math.max(640, cropWidth)
        outputHeight = outputWidth / aspectRatio
      } else {
        outputHeight = Math.max(640, cropHeight)
        outputWidth = outputHeight * aspectRatio
      }
      
      outputWidth = Math.max(640, outputWidth)
      outputHeight = Math.max(640, outputHeight)
      
      canvas.width = Math.round(outputWidth)
      canvas.height = Math.round(outputHeight)
      
      const context = canvas.getContext('2d')
      
      // Use white background
      context.fillStyle = '#FFFFFF'
      context.fillRect(0, 0, canvas.width, canvas.height)
      
      // Enable image smoothing for better quality
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      
      // Draw the cropped portion with proper scaling
      context.drawImage(
        img,
        Math.round(cropX), Math.round(cropY), Math.round(cropWidth), Math.round(cropHeight),
        0, 0, canvas.width, canvas.height
      )
      
      const croppedImageDataUrl = canvas.toDataURL('image/jpeg', 0.98)
      
      console.log('✅ Image cropped successfully:', {
        dimensions: `${canvas.width}x${canvas.height}`,
        cropArea: `${cropBox.width.toFixed(1)}% x ${cropBox.height.toFixed(1)}%`,
        aspectRatio: aspectRatio.toFixed(2),
        quality: 'high (0.98)',
        dataUrlLength: croppedImageDataUrl.length
      })
      
      stopCamera()
      setCapturedSnapshot(null)
      setIsCropping(false)
      
      // Pass cropped image to parent
      onCapture(croppedImageDataUrl)
      
      toast.success('✂️ Image cropped and ready for classification!', { duration: 3000 })
    } catch (error) {
      console.error('❌ Crop error:', error)
      toast.error('Failed to crop image. Please try again.')
    }
  }
  
  img.onerror = () => {
    toast.error('Failed to load snapshot for cropping')
    console.error('Image load error')
  }
  
  img.src = capturedSnapshot
}, [capturedSnapshot, cropBox, onCapture, stopCamera])

  const cancelCrop = () => {
    setCapturedSnapshot(null)
    setIsCropping(false)
    toast.info('Crop cancelled')
  }

  return (
    <div>
      <h3>📷 Capture from Camera</h3>
      
      {cameraError && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '1rem'
        }}>
          <strong style={{ color: '#dc2626' }}>❌ Camera Error:</strong>
          <p style={{ margin: '8px 0 0 0', color: '#991b1b', fontSize: '0.9rem' }}>
            {cameraError}
          </p>
        </div>
      )}

      <div 
        ref={containerRef}
        style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: '480px', 
          margin: '0 auto', 
          aspectRatio: '1/1', 
          backgroundColor: '#000', 
          borderRadius: '8px', 
          overflow: 'hidden', 
          marginBottom: '1rem',
          border: '2px solid #4CAF50'
        }}
      >
        {/* Live Video */}
        {!isCropping && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              display: isCameraActive ? 'block' : 'none'
            }}
          />
        )}

        {/* Snapshot for Cropping */}
        {isCropping && capturedSnapshot && (
          <>
            <img 
              src={capturedSnapshot} 
              alt="Snapshot" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain'
              }}
            />
            
            {/* Crop Overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              pointerEvents: 'none'
            }}>
              {/* Transparent crop area */}
              <div style={{
                position: 'absolute',
                left: `${cropBox.x}%`,
                top: `${cropBox.y}%`,
                width: `${cropBox.width}%`,
                height: `${cropBox.height}%`,
                backgroundColor: 'transparent',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
              }}></div>
            </div>

            {/* Draggable/Resizable Crop Box */}
            <div 
              onMouseDown={(e) => handleMouseDown(e)}
              style={{
                position: 'absolute',
                left: `${cropBox.x}%`,
                top: `${cropBox.y}%`,
                width: `${cropBox.width}%`,
                height: `${cropBox.height}%`,
                border: '3px solid #4CAF50',
                cursor: isDragging ? 'grabbing' : 'grab',
                pointerEvents: 'auto',
                zIndex: 20,
                boxShadow: '0 0 15px rgba(76, 175, 80, 0.8)'
              }}
            >
              {/* Resize Corners */}
              {['nw', 'ne', 'sw', 'se'].map(corner => (
                <div
                  key={corner}
                  onMouseDown={(e) => handleMouseDown(e, corner)}
                  style={{
                    position: 'absolute',
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#4CAF50',
                    border: '2px solid white',
                    borderRadius: '50%',
                    cursor: `${corner}-resize`,
                    zIndex: 30,
                    ...(corner === 'nw' && { top: '-10px', left: '-10px' }),
                    ...(corner === 'ne' && { top: '-10px', right: '-10px' }),
                    ...(corner === 'sw' && { bottom: '-10px', left: '-10px' }),
                    ...(corner === 'se' && { bottom: '-10px', right: '-10px' })
                  }}
                ></div>
              ))}
              
              {/* Center label */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(76, 175, 80, 0.9)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}>
                ✂️ Drag to Move | Resize Corners
              </div>
            </div>
          </>
        )}
        
        {isCameraActive && !isCropping && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: 'rgba(76, 175, 80, 0.9)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            zIndex: 10
          }}>
            🔴 LIVE
          </div>
        )}
        
        {!isCameraActive && !isCropping && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%', 
            color: '#fff', 
            fontSize: '1.2rem', 
            flexDirection: 'column', 
            gap: '1rem' 
          }}>
            <span style={{ fontSize: '3rem' }}>📷</span>
            <span>Camera Preview</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Click "Start Camera" to begin</span>
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <canvas ref={cropCanvasRef} style={{ display: 'none' }} />

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxWidth: '480px', margin: '0 auto' }}>
        {!isCameraActive && !isCropping && (
          <button 
            onClick={startCamera}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            📹 Start Camera
          </button>
        )}
        
        {isCameraActive && !isCropping && (
          <>
            <button 
              onClick={takeSnapshot}
              className="btn btn-primary"
              style={{ flex: 1, fontSize: '1.1rem' }}
            >
              📸 Take Snapshot
            </button>
            <button 
              onClick={() => {
                stopCamera()
                onClose()
              }}
              className="btn"
              style={{ flex: 1, backgroundColor: '#f44336', color: 'white' }}
            >
              ⏹️ Stop Camera
            </button>
          </>
        )}

        {isCropping && (
          <>
            <button 
              onClick={applyCrop}
              className="btn btn-primary"
              style={{ flex: 1, fontSize: '1.1rem' }}
            >
              ✂️ Crop & Use
            </button>
            <button 
              onClick={cancelCrop}
              className="btn"
              style={{ flex: 1, backgroundColor: '#ff9800', color: 'white' }}
            >
              ↩️ Retake
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default Camera