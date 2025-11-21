'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Cubie } from './Cubie';

const ANIMATION_SPEED = 0.25; // Quarter second per turn
const ROTATION_SPEED = Math.PI / 2 / 20; // Radians per frame approx, but we'll use time

interface Move {
  axis: 'x' | 'y' | 'z';
  slice: number; // -1, 0, 1
  dir: 1 | -1;
}

export default function RubiksCube({ 
  triggerShuffle, 
  triggerSolve,
  onShuffleStart,
  onShuffleEnd,
  onSolveStart,
  onSolveEnd
}: {
  triggerShuffle: number;
  triggerSolve: number;
  onShuffleStart: () => void;
  onShuffleEnd: () => void;
  onSolveStart: () => void;
  onSolveEnd: () => void;
}) {
  // State for the 27 cubies
  // We track their OBJECTS via refs, but we need to track their logical positions.
  // Actually, we can just query the objects' positions if we are careful.
  // But keeping a logical state is safer.
  
  const groupRef = useRef<THREE.Group>(null);
  const pivotRef = useRef<THREE.Group>(null);
  
  // We need references to the actual meshes to attach/detach
  const cubieRefs = useRef<(THREE.Group | null)[]>(new Array(27).fill(null));
  
  // Logical state: Array of { id, currentPos: Vector3, initialPos: Vector3 }
  // We initialize positions -1, 0, 1
  const [cubiesData] = useState(() => {
    const data = [];
    let id = 0;
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          data.push({
            id: id++,
            initialPos: [x, y, z] as [number, number, number],
            currentPos: new THREE.Vector3(x, y, z)
          });
        }
      }
    }
    return data;
  });

  // Move Queue
  const moveQueue = useRef<Move[]>([]);
  const isAnimating = useRef(false);
  const currentMove = useRef<{ move: Move, progress: number, activeCubieIndices: number[] } | null>(null);
  const history = useRef<Move[]>([]); // For solving

  // Interaction state
  const startPos = useRef<{ x: number, y: number } | null>(null);
  const intersectedFace = useRef<{ normal: THREE.Vector3, point: THREE.Vector3, cubieIndex: number } | null>(null);

  // Helpers
  const getCubiesInSlice = (axis: 'x' | 'y' | 'z', slice: number) => {
    return cubiesData.map((c, i) => {
      // We check the rounded current position
      const val = c.currentPos[axis];
      // Epsilon check for float errors
      if (Math.abs(val - slice) < 0.1) return i;
      return -1;
    }).filter(i => i !== -1);
  };

  const queueMove = (move: Move, record = true) => {
    if (record) history.current.push(move);
    moveQueue.current.push(move);
  };

  // Main Loop
  useFrame((state, delta) => {
    if (isAnimating.current && currentMove.current && pivotRef.current) {
      // Animate
      const { move, progress, activeCubieIndices } = currentMove.current;
      
      // Calculate step
      // For fixed time animation:
      const speed = 5 * delta; // Reduced from 10 to 5 for slower, more observable animation
      let newProgress = progress + speed;
      
      if (newProgress >= Math.PI / 2) {
        newProgress = Math.PI / 2;
      }

      const angleDelta = newProgress - progress;
      
      // Rotate pivot
      const axisVec = new THREE.Vector3(
        move.axis === 'x' ? 1 : 0,
        move.axis === 'y' ? 1 : 0,
        move.axis === 'z' ? 1 : 0
      );
      
      pivotRef.current.rotateOnWorldAxis(axisVec, move.dir * angleDelta);
      currentMove.current.progress = newProgress;

      if (newProgress >= Math.PI / 2) {
        // Finish move
        finishMove();
      }
    } else if (moveQueue.current.length > 0) {
      // Start next move
      startMove(moveQueue.current.shift()!);
    }
  });

  const startMove = (move: Move) => {
    if (!groupRef.current || !pivotRef.current) return;
    
    const indices = getCubiesInSlice(move.axis, move.slice);
    if (indices.length === 0) return; // Should not happen

    isAnimating.current = true;
    
    // Reset pivot to 0
    pivotRef.current.rotation.set(0, 0, 0);
    pivotRef.current.position.set(0, 0, 0);
    pivotRef.current.updateMatrixWorld();

    // Attach cubies to pivot
    indices.forEach(idx => {
      const cubieGroup = cubieRefs.current[idx];
      if (cubieGroup) {
        pivotRef.current!.attach(cubieGroup);
      }
    });

    currentMove.current = {
      move,
      progress: 0,
      activeCubieIndices: indices
    };
  };

  const finishMove = () => {
    if (!currentMove.current || !pivotRef.current || !groupRef.current) return;
    
    const { activeCubieIndices, move } = currentMove.current;

    // Detach from pivot back to group
    // The transform is preserved by .attach() which is inverse of what we want?
    // THREE.Object3D.attach(child) removes from parent and adds to this, maintaining world transform.
    // So to go back, we attach back to groupRef.
    
    pivotRef.current.updateMatrixWorld();
    
    activeCubieIndices.forEach(idx => {
      const cubieGroup = cubieRefs.current[idx];
      if (cubieGroup) {
        groupRef.current!.attach(cubieGroup);
        
        // Round transforms to prevent drift
        cubieGroup.position.x = Math.round(cubieGroup.position.x);
        cubieGroup.position.y = Math.round(cubieGroup.position.y);
        cubieGroup.position.z = Math.round(cubieGroup.position.z);
        
        // Round rotation (quaternion is harder, stick to euler snap if close? 
        // Better: Just assume the visuals are close enough, but update the LOGICAL state perfectly.
        // Actually, we must correct the visual drift or it builds up.
        // Let's just round positions.
        // Rotations are tricky. We can re-orthogonalize the matrix.
        
        const euler = new THREE.Euler().setFromQuaternion(cubieGroup.quaternion);
        cubieGroup.rotation.set(
          Math.round(euler.x / (Math.PI/2)) * (Math.PI/2),
          Math.round(euler.y / (Math.PI/2)) * (Math.PI/2),
          Math.round(euler.z / (Math.PI/2)) * (Math.PI/2)
        );
        cubieGroup.updateMatrix();
        
        // Update Logical Position
        cubiesData[idx].currentPos.copy(cubieGroup.position);
      }
    });

    isAnimating.current = false;
    currentMove.current = null;
    
    // Check if we are shuffling/solving and need to continue
    // The useFrame loop handles the queue
  };

  // Shuffle Logic
  useEffect(() => {
    if (triggerShuffle === 0) return;
    
    onShuffleStart();
    const moves: Move[] = [];
    for (let i = 0; i < 25; i++) { // 25 random moves
      const axis = ['x', 'y', 'z'][Math.floor(Math.random() * 3)] as 'x' | 'y' | 'z';
      const slice = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
      const dir = Math.random() > 0.5 ? 1 : -1;
      moves.push({ axis, slice, dir });
    }
    
    // Clear history if we want a fresh start, or append? 
    // User probably wants to solve *this* shuffle.
    // Note: "Solve" usually means reverse *all* history.
    
    moves.forEach(m => queueMove(m));
    
    // Hacky way to know when done: monitor queue length?
    // We'll leave onShuffleEnd for now or assume it ends when queue empty.
    // Ideally we pass a callback to the last move.
    
    setTimeout(() => {
        onShuffleEnd(); // This is fake, ideally we track the queue
    }, 1000 + moves.length * 200);
    
  }, [triggerShuffle]);

  // Solve Logic
  useEffect(() => {
    if (triggerSolve === 0) return;
    onSolveStart();
    
    // Create reverse moves from history
    const reverseMoves = [...history.current].reverse().map(m => ({
      ...m,
      dir: (m.dir * -1) as 1 | -1
    }));
    
    // Clear history so we don't re-solve
    history.current = [];
    
    // Queue them
    // Important: Don't record these moves in history!
    reverseMoves.forEach(m => queueMove(m, false));
    
    setTimeout(() => {
        onSolveEnd();
    }, 1000 + reverseMoves.length * 200);

  }, [triggerSolve]);


  // Input Handlers
  const { camera, raycaster } = useThree();
  
  const handlePointerDown = (e: any) => {
    // Only handle primary button (left click)
    if (e.button !== 0) return;
    
    // Stop propagation so OrbitControls doesn't steal immediately if we are on a cube
    e.stopPropagation();
    startPos.current = { x: e.clientX, y: e.clientY };
    
    if (e.face) {
      intersectedFace.current = {
        normal: e.face.normal.clone(),
        point: e.point,
        cubieIndex: cubiesData.findIndex(c => cubieRefs.current[c.id] === e.object.parent) 
      };
    }
  };

  const handlePointerUp = (e: any) => {
    if (!startPos.current || !intersectedFace.current) {
        startPos.current = null;
        intersectedFace.current = null;
        return;
    }

    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        startPos.current = null;
        intersectedFace.current = null;
        return;
    }
    
    const idx = intersectedFace.current.cubieIndex;
    if (idx === -1) return;
    
    // Heuristic for face normal
    const p = intersectedFace.current.point;
    let normalAxis = '';
    // Use a slightly tighter bound because the cube is rotated
    // But we are clicking in world space. 
    // Wait, the cube group is rotated initially.
    // We need the local point on the cube group? 
    // No, let's use the logic that worked before but robustify.
    
    // Actually, the best way is to check which coordinate is closest to +/- 1.5 (ignoring the initial tilt if we undo it, but we don't)
    // Better: Use the face normal from the intersection, transform it by the object's rotation to get world normal?
    // e.face.normal is local.
    
    // Let's assume the user is dragging relative to the SCREEN.
    // We need to map Screen X/Y drag to Cube Axes based on the view.
    // This is tricky without full projection math.
    // Sticking to the previous heuristic which worked for "standard" views, 
    // but since the user can now rotate freely, we need something better.
    
    // New Logic:
    // 1. Get camera view direction.
    // 2. Compare drag vector with projected cube axes.
    
    // But for now, let's just enable free rotation of the whole cube group by 
    // REMOVING the fixed rotation on the group wrapper.
    
    // ... (Movement logic same as before) ...
    
    // Re-implement the heuristic which assumes the cube is roughly axis aligned visually or we can determine the face.
    // Since we can rotate freely, "Up" on screen might be "X" on cube.
    
    // Let's cheat:
    // 1. Identify the clicked face using local coordinates of the clicked cubie.
    // The cubie itself is rotated by the group.
    // Let's inverse the group rotation to find the local face?
    
    // Actually, `e.object` is the sticker mesh. Its local Z is the face normal!
    // We can transform (0,0,1) by the mesh's world matrix to get world normal.
    const mesh = e.object;
    const worldNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.getWorldQuaternion(new THREE.Quaternion()));
    
    // Find dominant axis of world normal
    const ax = Math.abs(worldNormal.x);
    const ay = Math.abs(worldNormal.y);
    const az = Math.abs(worldNormal.z);
    
    let dominantAxis = 'z';
    if (ax > ay && ax > az) dominantAxis = 'x';
    else if (ay > ax && ay > az) dominantAxis = 'y';
    
    // Now map dragging.
    // If dominant is Z (Front/Back):
    //   Drag Horizontal (Screen X) -> Rotate around Y axis (World Y? No, Cube Y)
    //   Drag Vertical (Screen Y) -> Rotate around X axis
    
    // BUT "Cube Y" might be rotated.
    // We need to find which Cube Axis projects most parallel to the drag vector.
    
    // Helper to project a world vector to screen space
    const project = (v: THREE.Vector3) => {
        const temp = v.clone();
        temp.project(camera);
        return new THREE.Vector2(temp.x, temp.y); // -1 to 1
    }
    
    // Cube Axes in World Space (apply group rotation)
    // The groupRef has the rotation.
    const groupQuat = groupRef.current?.quaternion || new THREE.Quaternion();
    
    const uX = new THREE.Vector3(1, 0, 0).applyQuaternion(groupQuat);
    const uY = new THREE.Vector3(0, 1, 0).applyQuaternion(groupQuat);
    const uZ = new THREE.Vector3(0, 0, 1).applyQuaternion(groupQuat);
    
    // Start and End points in NDC
    const startNDC = new THREE.Vector2(
        (startPos.current.x / window.innerWidth) * 2 - 1,
        -(startPos.current.y / window.innerHeight) * 2 + 1
    );
    const endNDC = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
    );
    const dragVec = endNDC.clone().sub(startNDC);
    
    // We need to rotate around an axis PERPENDICULAR to the drag direction (roughly).
    // Or rather, if we drag along uX, we are rotating around uY (or uZ depending on face).
    
    // Simplified:
    // If we click a face with Normal N.
    // The possible rotation axes are the other two axes.
    // e.g. Normal = X. Rotation axes = Y or Z.
    // Project uY and uZ to screen.
    // See which one matches the dragVec better (dot product).
    
    let candidateAxes: { axis: 'x'|'y'|'z', vec: THREE.Vector3 }[] = [];
    
    // Determine Local Normal of the clicked face (unrotated)
    // Cubie is at (x,y,z). Face direction is determined by which mesh was clicked.
    // If we rely on `dominantAxis` of world normal, it might flip if cube is upside down.
    
    // Better: Use the local rotation of the cubie (which tracks the face)?
    // No, the cubie mesh rotation resets. The group pivot handles rotation.
    // Cubie Position tracks the logical slot.
    
    // Let's stick to World Normal Dominant Axis for face selection,
    // then check alignment of World Axes for movement.
    
    if (dominantAxis === 'x') {
        candidateAxes = [{ axis: 'y', vec: uY }, { axis: 'z', vec: uZ }];
    } else if (dominantAxis === 'y') {
        candidateAxes = [{ axis: 'x', vec: uX }, { axis: 'z', vec: uZ }];
    } else {
        candidateAxes = [{ axis: 'x', vec: uX }, { axis: 'y', vec: uY }];
    }
    
    // Find best match
    // We drag ALONG a face direction to rotate around the cross product axis?
    // Example: Front Face (Z). Drag Horizontal (X). We want to rotate around Y.
    // The drag vector aligns with X. The rotation axis is Y.
    
    let bestAxis: 'x'|'y'|'z' = 'x';
    let maxDot = -1;
    let moveDir: 1 | -1 = 1;
    
    candidateAxes.forEach(cand => {
        // Project the axis vector to screen
        // Note: We want to know if we dragged ALONG this axis.
        // If we drag along uX, we want to rotate around uY (if Z face).
        // Wait, if I drag along uX on Front face, I am rotating the horizontal slice... around Y. Correct.
        // So we check alignment with the candidate axes.
        
        // BUT: candidateAxes contains the AXES TO ROTATE AROUND?
        // If Front Face (Z). Candidates are X and Y.
        // If I drag along X, I rotate around Y.
        // If I drag along Y, I rotate around X.
        
        // So we need to compare drag with the *other* axis?
        // Let's check alignment with the projected vectors of the potential MOVEMENT directions.
        
        // For Z face:
        // Movement along X -> Rotation Axis Y
        // Movement along Y -> Rotation Axis X
        
        // So we need to project uX and uY.
        // If match Y -> Rotate Z.
        
        const pStart = startPos.current!; // Using screen coords for simplicity/robustness? 
        // Use NDC logic
        
        // Project candidate vector start (center of cube roughly) and end
        // Actually just project the vector direction relative to camera up/right?
        // Standard project approach:
        const vecStart = new THREE.Vector3(0,0,0).project(camera);
        const vecEnd = cand.vec.clone().normalize().multiplyScalar(1).project(camera); // 1 unit along axis
        const screenVec = new THREE.Vector2(vecEnd.x - vecStart.x, vecEnd.y - vecStart.y).normalize();
        
        const dragDir = dragVec.clone().normalize();
        const dot = Math.abs(screenVec.dot(dragDir));
        
        // We are matching the DRAG DIRECTION.
        // If we match this candidate axis, it means we are dragging ALONG this axis.
        // Which means we are rotating around the *cross product* of (FaceNormal, ThisAxis).
        
        if (dot > maxDot) {
            maxDot = dot;
            // Determine rotation axis based on match
            // If Face X. Match Y -> Axis is Z.
            // If Face X. Match Z -> Axis is Y.
            
            // Let's solve this dynamically.
            // Rotation Axis = Cross(Normal, MoveDirection)
            // MoveDirection is `cand.axis`.
            // Normal is `dominantAxis`.
            
            // We need to find the third axis.
            // X, Y, Z
            const axes = ['x', 'y', 'z'];
            const ax1 = dominantAxis;
            const ax2 = cand.axis;
            const ax3 = axes.find(a => a !== ax1 && a !== ax2) as 'x'|'y'|'z';
            
            bestAxis = ax3;
            
            // Direction?
            // Need to check sign of dot product vs orientation.
            // Also need to handle if we are looking from behind.
            
            // Simple heuristic for direction:
            // Calculate the screen vector of the 'positive' move.
            // If drag aligns (+dot), we are moving +; else -.
            // Then map that move to rotation direction.
            // Right hand rule: X cross Y = Z.
            // If Face Z (Front). Drag X (+). X cross Z = -Y? No Z cross X = Y.
            // If I drag Right on Front face, I rotate the face clockwise looking from top? No.
            // I rotate the whole cube around Y.
            // Looking from Front, dragging Right (X+) -> Rotate Y (-)?
            // Let's just use trial/error logic or simple checks.
            
            const rawDot = screenVec.dot(dragDir);
            const moveSign = rawDot > 0 ? 1 : -1;
            
            // Visual correction based on face/axis combo
            // Ideally we trace the exact cross product logic but it's error prone in heads.
            // Let's invert moveDir if needed.
            
            moveDir = moveSign; // Placeholder
            
            // Fix direction logic:
            // Rotations are always Right-Hand Rule around axis.
            // Axis X: Thumb right. Fingers curl Up->Front->Down->Back.
            // Axis Y: Thumb up. Fingers curl Right->Back->Left->Front.
            // Axis Z: Thumb out. Fingers curl Right->Up->Left->Down. (Standard 2D cartesian CCW)
            
            // If Face Z (Front). Drag X+. 
            // We want faces to move Right. 
            // This corresponds to Rotation around Y (Thumb Up). 
            // Rotation Y (Standard) moves Front face Left! (Right->Back->Left)
            // So Drag X+ needs Rot Y-.
            if (dominantAxis === 'z' && cand.axis === 'x') moveDir *= -1;
            
            // If Face Z. Drag Y+.
            // We want faces move Up.
            // Rot X (Thumb Right) moves Front Up? (Up->Front.. No, Front->Down).
            // Rot X moves Front Down.
            // So Drag Y+ needs Rot X+ (to move Front Down? No wait).
            // If I drag Up, I want the texture to move Up.
            // Rot X+ moves Front face Down. So I need Rot X-.
            if (dominantAxis === 'z' && cand.axis === 'y') moveDir *= -1;
            
            // Apply similar logic or generalize?
            // General Cross Product: Move x Normal = Rotation Axis?
            // X (Move) x Z (Normal) = -Y.
            // Y (Move) x Z (Normal) = X.
            // Matches our finding (Drag X needs -Y, Drag Y needs X).
            // So logic: Rotation Axis = Cross(Move, Normal).
            // We just need to implement Cross product logic for axes strings.
            
            // However, we already found `bestAxis`.
            // Just need to check sign of Cross(cand.axis, dominantAxis).
            // Or Cross(Move, Normal).
            
            // Let's do:
            // Cross(cand, dominant) -> gives the axis.
            // Check sign of result.
            
            // X=0, Y=1, Z=2
            const map = {x:0, y:1, z:2};
            const i1 = map[cand.axis];
            const i2 = map[dominantAxis as 'x'|'y'|'z'];
            
            // (i1 - i2 + 3) % 3
            // 1 (Y) cross 2 (Z) = 0 (X) -> Sign +1
            // 2 (Z) cross 1 (Y) = 0 (X) -> Sign -1
            // 0 (X) cross 1 (Y) = 2 (Z) -> Sign +1
            
            // Cyclic order: X->Y->Z->X
            // If Move is 'next' after Normal -> +1.
            // If Move is 'prev' before Normal -> -1.
            
            let crossSign = 1;
            if ((i1 + 1) % 3 === i2) crossSign = -1; // Move is before Normal
            else crossSign = 1; // Move is after Normal
            
            moveDir *= crossSign;
        }
    });

    // Determine slice
    const cubiePos = cubiesData[idx].currentPos;
    const sliceIndex = Math.round(cubiePos[bestAxis]);
    
    queueMove({ axis: bestAxis, slice: sliceIndex, dir: moveDir });

    startPos.current = null;
    intersectedFace.current = null;
  };

  return (
    <group 
      rotation={[0.5, -0.4, 0]} // Initial tilt for better visibility
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => { startPos.current = null; }}
    >
        {/* Pivot Group for Animation */}
        <group ref={pivotRef} />
        
        {/* Main Group containing Cubies */}
        <group ref={groupRef}>
            {cubiesData.map((data, i) => (
                <Cubie
                    key={data.id}
                    ref={(el) => { cubieRefs.current[i] = el; }}
                    position={data.initialPos} // Initial Render Position
                    initialPosition={data.initialPos} // Texture Mapping
                />
            ))}
        </group>
    </group>
  );
}
