'use client'

import Image from 'next/image'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import {
  ACESFilmicToneMapping,
  AmbientLight,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from 'three'
import { easeInOutCubic, easeOutCubic, range } from '@/hooks/use-smooth-scroll-progress'

const layer = (stage: HTMLElement, name: string) => stage.querySelector<HTMLElement>(`[data-layer="${name}"]`)

export type SacredTreeHandle = {
  render: (progress: number) => void
}

type BranchSpec = {
  anchor: [number, number, number]
  points: [number, number, number][]
  radii: number[]
}

const TRUNK_POINTS: [number, number, number][] = [
  [0, 0, 0],
  [-0.08, 0.86, 0.01],
  [0.08, 1.72, 0.02],
  [-0.14, 2.58, -0.02],
  [0.04, 3.38, -0.04],
  [-0.02, 4.04, -0.02],
  [0.24, 4.62, -0.02],
]

const TRUNK_RADII = [0.48, 0.43, 0.36, 0.29, 0.22, 0.14, 0.025]

const BRANCHES: BranchSpec[] = [
  {
    anchor: [-0.13, 2.55, -0.01],
    points: [[0, 0, 0], [-0.56, 0.18, 0.02], [-1.04, 0.55, 0.08], [-1.5, 1.16, 0.12], [-2.2, 1.31, 0.08]],
    radii: [0.27, 0.23, 0.16, 0.1, 0.02],
  },
  {
    anchor: [-0.11, 3.1, -0.02],
    points: [[0, 0, 0], [0.38, 0.27, -0.02], [0.82, 0.58, -0.1], [1.32, 1.02, -0.12], [1.94, 1.12, -0.14]],
    radii: [0.24, 0.2, 0.14, 0.085, 0.018],
  },
  {
    anchor: [0.01, 3.62, -0.02],
    points: [[0, 0, 0], [-0.36, 0.26, -0.04], [-0.8, 0.68, -0.11], [-1.28, 1.12, -0.13], [-1.8, 1.33, -0.18]],
    radii: [0.19, 0.15, 0.11, 0.07, 0.015],
  },
  {
    anchor: [0.06, 3.86, -0.05],
    points: [[0, 0, 0], [0.42, 0.18, -0.02], [0.86, 0.56, -0.12], [1.34, 0.84, -0.15], [1.88, 1.02, -0.18]],
    radii: [0.17, 0.14, 0.095, 0.06, 0.012],
  },
  {
    anchor: [-0.02, 4.12, -0.03],
    points: [[0, 0, 0], [-0.3, 0.24, 0.02], [-0.58, 0.62, 0.08], [-0.92, 0.96, 0.1]],
    radii: [0.13, 0.1, 0.065, 0.012],
  },
]

function addTaperedPath(parent: Group, points: [number, number, number][], radii: number[], material: MeshStandardMaterial, radialSegments = 9) {
  const curve = new CatmullRomCurve3(points.map((point) => new Vector3(...point)), false, 'centripetal')
  const tubularSegments = Math.max(20, (points.length - 1) * 12)
  const frames = curve.computeFrenetFrames(tubularSegments, false)
  const vertices: number[] = []
  const indices: number[] = []

  const radiusAt = (t: number) => {
    const point = t * (radii.length - 1)
    const lower = Math.floor(point)
    const fraction = point - lower
    const start = radii[lower]
    const end = radii[Math.min(lower + 1, radii.length - 1)]
    return start + (end - start) * fraction
  }

  for (let ring = 0; ring <= tubularSegments; ring += 1) {
    const t = ring / tubularSegments
    const center = curve.getPointAt(t)
    const radius = radiusAt(t)
    const normal = frames.normals[ring]
    const binormal = frames.binormals[ring]
    for (let side = 0; side <= radialSegments; side += 1) {
      const angle = (side / radialSegments) * Math.PI * 2
      const offset = normal.clone().multiplyScalar(Math.cos(angle) * radius)
        .add(binormal.clone().multiplyScalar(Math.sin(angle) * radius))
      vertices.push(center.x + offset.x, center.y + offset.y, center.z + offset.z)
      if (ring < tubularSegments && side < radialSegments) {
        const a = ring * (radialSegments + 1) + side
        const b = a + radialSegments + 1
        indices.push(a, b, a + 1, a + 1, b, b + 1)
      }
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const mesh = new Mesh(geometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)
}

function random01(index: number, seed: number) {
  const value = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453123
  return value - Math.floor(value)
}

function buildSacredTree(scene: Scene) {
  const tree = new Group()
  tree.position.set(2.4, 0, 0)
  scene.add(tree)

  const wood = new MeshStandardMaterial({ color: '#765034', roughness: 0.9 })
  const woodLight = new MeshStandardMaterial({ color: '#a27a4d', roughness: 0.84 })
  const woodDark = new MeshStandardMaterial({ color: '#3b2b21', roughness: 0.96 })
  const roots = new Group()
  tree.add(roots)
  addTaperedPath(roots, [[0, 0.02, 0], [-0.44, -0.04, 0.06], [-1.02, -0.1, 0.24], [-1.6, -0.18, 0.34]], [0.31, 0.22, 0.1, 0.018], woodDark)
  addTaperedPath(roots, [[0, 0.01, 0], [0.35, -0.04, 0.1], [0.9, -0.12, 0.32], [1.48, -0.19, 0.44]], [0.3, 0.2, 0.09, 0.016], wood)
  addTaperedPath(roots, [[-0.05, 0.03, 0], [-0.12, -0.02, -0.45], [-0.44, -0.12, -0.94], [-0.78, -0.2, -1.3]], [0.24, 0.17, 0.08, 0.012], wood)
  addTaperedPath(roots, [[0.06, 0.03, 0], [0.22, -0.02, -0.42], [0.48, -0.1, -0.9], [0.88, -0.18, -1.2]], [0.22, 0.15, 0.07, 0.012], woodLight)

  const trunk = new Group()
  tree.add(trunk)
  addTaperedPath(trunk, TRUNK_POINTS, TRUNK_RADII, wood, 11)
  addTaperedPath(trunk, [[-0.07, 0.12, 0.29], [-0.17, 0.95, 0.34], [-0.01, 1.83, 0.31], [-0.2, 2.66, 0.24], [-0.02, 3.48, 0.18], [0.02, 4.15, 0.12]], [0.045, 0.032, 0.028, 0.024, 0.018, 0.008], woodDark, 6)
  addTaperedPath(trunk, [[0.15, 0.22, 0.3], [0.05, 1.0, 0.34], [0.21, 1.8, 0.29], [-0.02, 2.64, 0.23], [0.18, 3.45, 0.18], [0.13, 4.18, 0.11]], [0.04, 0.031, 0.024, 0.02, 0.014, 0.006], woodLight, 6)

  const branchGroups: Group[] = []
  for (const [index, spec] of BRANCHES.entries()) {
    const branch = new Group()
    branch.position.set(...spec.anchor)
    addTaperedPath(branch, spec.points, spec.radii, index % 2 === 0 ? wood : woodLight, 8)
    trunk.add(branch)
    branchGroups.push(branch)
  }

  const foliage = new Group()
  foliage.position.set(0.05, 4.14, 0)
  tree.add(foliage)
  const leafCount = 1320
  const leafGeometry = new IcosahedronGeometry(1, 1)
  const leafMaterial = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.88, vertexColors: false })
  const leaves = new InstancedMesh(leafGeometry, leafMaterial, leafCount)
  const dummy = new Group()
  const matrix = new Matrix4()
  const palette = ['#263e2b', '#355238', '#456744', '#68784a', '#213a2b', '#8d8351']
  for (let index = 0; index < leafCount; index += 1) {
    const theta = random01(index, 1) * Math.PI * 2
    const phi = Math.acos(2 * random01(index, 2) - 1)
    const radius = Math.cbrt(random01(index, 3))
    const x = Math.sin(phi) * Math.cos(theta) * 2.55 * radius
    const y = Math.cos(phi) * 1.18 * radius
    const z = Math.sin(phi) * Math.sin(theta) * 0.88 * radius
    dummy.position.set(x, y, z)
    dummy.rotation.set(random01(index, 4) * 0.8, theta, random01(index, 5) * Math.PI)
    const size = 0.038 + random01(index, 6) * 0.047
    dummy.scale.set(size * 1.45, size * 0.68, size * 0.72)
    dummy.updateMatrix()
    matrix.copy(dummy.matrix)
    leaves.setMatrixAt(index, matrix)
    leaves.setColorAt(index, new Color(palette[Math.floor(random01(index, 7) * palette.length)]))
  }
  leaves.instanceMatrix.needsUpdate = true
  if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true
  foliage.add(leaves)

  const stumpHaloMaterial = new MeshStandardMaterial({ color: '#d5b779', emissive: '#8d6832', emissiveIntensity: 0.55, roughness: 0.42, metalness: 0.25, transparent: true, opacity: 0.12 })
  const stumpHalo = new Mesh(new TorusGeometry(0.88, 0.018, 7, 90), stumpHaloMaterial)
  stumpHalo.rotation.x = Math.PI / 2
  stumpHalo.position.y = 0.12
  tree.add(stumpHalo)

  const ceremony = new Group()
  tree.add(ceremony)
  const ringMaterials = [
    new MeshStandardMaterial({ color: '#c7a564', emissive: '#b8843d', emissiveIntensity: 0.85, roughness: 0.38, metalness: 0.32, transparent: true, opacity: 0 }),
    new MeshStandardMaterial({ color: '#9d6547', emissive: '#64301d', emissiveIntensity: 0.5, roughness: 0.55, metalness: 0.1, transparent: true, opacity: 0 }),
  ]
  const ritualRings = ringMaterials.map((material, index) => {
    const ring = new Mesh(new TorusGeometry(index === 0 ? 2.5 : 1.95, index === 0 ? 0.018 : 0.012, 7, 112), material)
    ring.position.set(0.02, index === 0 ? 4.65 : 4.08, index === 0 ? -0.1 : 0.05)
    ring.rotation.set(Math.PI / 2 + (index === 0 ? 0.2 : -0.26), index === 0 ? 0.05 : -0.2, index === 0 ? -0.18 : 0.12)
    ceremony.add(ring)
    return ring
  })

  const dustPositions: number[] = []
  for (let index = 0; index < 150; index += 1) {
    dustPositions.push(
      (random01(index, 8) - 0.5) * 7,
      random01(index, 9) * 5.6 + 0.1,
      (random01(index, 10) - 0.5) * 2.4,
    )
  }
  const dustGeometry = new BufferGeometry()
  dustGeometry.setAttribute('position', new Float32BufferAttribute(dustPositions, 3))
  const dustCloud = new PointsMaterial({ color: '#e5c681', size: 0.055, transparent: true, opacity: 0, depthWrite: false })
  const dust = new Points(dustGeometry, dustCloud)
  tree.add(dust)

  const baseLight = new PointLight('#d5ae62', 0.35, 5.2, 1.7)
  baseLight.position.set(0, 0.75, 0.85)
  tree.add(baseLight)

  return {
    tree,
    roots,
    trunk,
    branchGroups,
    foliage,
    ceremony,
    ritualRings,
    ringMaterials,
    stumpHaloMaterial,
    dustCloud,
    dust,
    baseLight,
  }
}

export const SacredTreeCanvas = forwardRef<SacredTreeHandle>(function SacredTreeCanvas(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const updateRef = useRef<(progress: number) => void>(() => undefined)

  useImperativeHandle(ref, () => ({ render: (progress) => updateRef.current(progress) }), [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: WebGLRenderer | null = null
    let disposed = false
    let treeBits: ReturnType<typeof buildSacredTree> | null = null
    let animationActive = false
    const scene = new Scene()
    scene.add(new HemisphereLight('#f5e7c2', '#17271d', 1.7))
    scene.add(new AmbientLight('#d9d0b6', 0.45))
    const sun = new DirectionalLight('#f7d9a0', 2.9)
    sun.position.set(-4.5, 8, 7)
    sun.castShadow = true
    scene.add(sun)
    const rim = new DirectionalLight('#b8c49a', 1.25)
    rim.position.set(5, 4, -4)
    scene.add(rim)

    const camera = new PerspectiveCamera(38, 1, 0.1, 80)
    const updateCamera = () => {
      if (!renderer) return
      const width = Math.max(canvas.clientWidth, 1)
      const height = Math.max(canvas.clientHeight, 1)
      const portrait = width / height < 0.76
      camera.aspect = width / height
      camera.fov = portrait ? 49 : 38
      camera.position.set(0, portrait ? 4.65 : 3.55, portrait ? 11.6 : 14)
      camera.lookAt(0, portrait ? 1.55 : 0.88, 0)
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, portrait ? 1.25 : 1.5))
      renderer.setSize(width, height, false)
      if (treeBits) {
        treeBits.tree.position.x = portrait ? 0 : 2.4
      const scale = portrait ? 0.76 : 0.9
        treeBits.tree.scale.setScalar(scale)
      }
    }

    try {
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
      renderer.outputColorSpace = SRGBColorSpace
      renderer.toneMapping = ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15
      renderer.setClearColor(0x000000, 0)
      treeBits = buildSacredTree(scene)
      updateCamera()
      const media = window.matchMedia('(prefers-reduced-motion: reduce)')
      let renderFrame: (time: number) => void = () => undefined
      updateRef.current = (next) => {
        if (!treeBits) return
        const rootGrowth = easeOutCubic(range(next, 0.1, 0.43))
        const trunkGrowth = easeInOutCubic(range(next, 0.29, 0.67))
        const foliageGrowth = easeOutCubic(range(next, 0.66, 0.91))
        const ritualGrowth = easeInOutCubic(range(next, 0.82, 0.98))
        treeBits.roots.scale.set(rootGrowth, rootGrowth, rootGrowth)
        treeBits.trunk.scale.y = trunkGrowth
        for (const [index, branch] of treeBits.branchGroups.entries()) {
          const delay = index * 0.025
          const branchScale = easeOutCubic(range(next, 0.49 + delay, 0.79 + delay))
          branch.scale.setScalar(branchScale)
        }
        treeBits.foliage.scale.set(foliageGrowth, foliageGrowth, foliageGrowth)
        treeBits.ceremony.scale.setScalar(ritualGrowth)
        treeBits.stumpHaloMaterial.opacity = 0.12 + rootGrowth * 0.28
        treeBits.ringMaterials[0].opacity = ritualGrowth * 0.78
        treeBits.ringMaterials[1].opacity = ritualGrowth * 0.52
        treeBits.dustCloud.opacity = ritualGrowth * 0.75
        treeBits.baseLight.intensity = 0.35 + Math.sin(next * Math.PI) * 0.9
        if (!renderer) return
        if (media.matches || next <= 0.005) {
          if (animationActive) {
            renderer.setAnimationLoop(null)
            animationActive = false
          }
          renderer.render(scene, camera)
        } else if (!animationActive) {
          renderer.setAnimationLoop(renderFrame)
          animationActive = true
        }
      }

      const resize = () => {
        updateCamera()
        if (media.matches && renderer) renderer.render(scene, camera)
      }
      window.addEventListener('resize', resize)
      renderFrame = (time: number) => {
        if (disposed || !treeBits) return
        if (!renderer) return
        if (!media.matches) {
          treeBits.ritualRings[0].rotation.y = time * 0.000035
          treeBits.ritualRings[1].rotation.y = -time * 0.000052
          treeBits.foliage.rotation.y = Math.sin(time * 0.00011) * 0.012
          treeBits.dust.rotation.y = time * 0.000025
        }
        renderer.render(scene, camera)
      }

      return () => {
        disposed = true
        window.removeEventListener('resize', resize)
        renderer?.setAnimationLoop(null)
        scene.traverse((object) => {
          if (object instanceof Mesh || object instanceof InstancedMesh || object instanceof Points) {
            object.geometry.dispose()
            const material = object.material
            if (Array.isArray(material)) material.forEach((item) => item.dispose())
            else material.dispose()
          }
        })
        renderer?.dispose()
        updateRef.current = () => undefined
      }
    } catch {
      const fallback = canvas.parentElement?.querySelector<HTMLElement>('[data-layer="tree-fallback"]')
      if (fallback) fallback.style.opacity = '1'
      return () => {
        disposed = true
        renderer?.dispose()
      }
    }
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 z-20 opacity-0" data-layer="tree-canvas-wrap" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <svg className="absolute inset-0 h-full w-full opacity-0" data-layer="tree-fallback" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="fallback-bark" x1="0" x2="1" y1="0" y2="0">
            <stop stopColor="#3c2b20" />
            <stop offset=".48" stopColor="#a47a4b" />
            <stop offset="1" stopColor="#493328" />
          </linearGradient>
          <radialGradient id="fallback-leaves">
            <stop stopColor="#80905a" />
            <stop offset="1" stopColor="#263f2c" />
          </radialGradient>
        </defs>
        <g transform="translate(1115 650)">
          <path d="M-12 0 C-25-125 9-230-6-340 C-18-423 12-484 26-535 L78-518 C47-440 46-380 70-318 C101-230 54-123 79 0Z" fill="url(#fallback-bark)" />
          <path d="M13-294 C-65-332-94-405-166-427 M56-335 C122-371 160-414 199-456 M18-409 C-28-459-58-495-75-535 M67-455 C101-487 122-515 138-550" fill="none" stroke="#795537" strokeLinecap="round" strokeWidth="25" />
          <g fill="url(#fallback-leaves)" stroke="#b49b61" strokeOpacity=".3">
            <ellipse cx="-160" cy="-448" rx="100" ry="62" /><ellipse cx="-67" cy="-503" rx="116" ry="74" />
            <ellipse cx="60" cy="-535" rx="120" ry="82" /><ellipse cx="173" cy="-470" rx="112" ry="72" />
            <ellipse cx="230" cy="-414" rx="72" ry="54" /><ellipse cx="-228" cy="-404" rx="67" ry="50" />
            <ellipse cx="-46" cy="-406" rx="120" ry="72" /><ellipse cx="110" cy="-405" rx="123" ry="75" />
          </g>
        </g>
      </svg>
    </div>
  )
})

export function SacredTreeLayers() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden bg-[#101712]">
      <div className="absolute inset-0 opacity-0 will-change-transform" data-layer="tree-environment" style={{ transformOrigin: '69.8% 48.3%' }}>
        <Image
          src="/images/relic-outdoor.jpg"
          alt="概念艺术场景：林间古木桩与遗址石墙，作为神树生长的想象性背景"
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 opacity-0 bg-[linear-gradient(90deg,rgba(5,10,8,0.88)_0%,rgba(5,10,8,0.65)_27%,rgba(5,10,8,0.18)_52%,transparent_76%)] max-md:bg-[linear-gradient(0deg,rgba(5,10,8,0.85)_0%,rgba(5,10,8,0.25)_42%,transparent_82%)]" data-layer="tree-copy-shade" />
      <div className="absolute inset-0 opacity-0 mix-blend-screen bg-[radial-gradient(ellipse_at_69%_57%,rgba(236,192,110,0.44),rgba(190,151,91,0.18)_18%,transparent_52%)]" data-layer="tree-awakening-glow" />
      <div className="absolute inset-0 opacity-0 bg-[radial-gradient(ellipse_at_70%_48%,transparent_20%,rgba(5,9,7,0.26)_100%)]" data-layer="tree-vignette" />
      <div className="absolute inset-x-0 bottom-0 h-[29vh] opacity-0 bg-[linear-gradient(0deg,rgba(5,10,7,0.76),transparent)]" data-layer="tree-ground-shadow" />
    </div>
  )
}

export function SacredTreeOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <header className="absolute inset-x-0 top-0 flex items-start justify-between px-6 py-6 opacity-0 md:px-12 md:py-10" data-layer="tree-header">
        <p className="font-sans text-[10px] tracking-[0.32em] text-bone/85 md:text-[11px]">LONGLIN <span className="mx-2 text-bone/50">/</span> HERITAGE IMMERSIVE EXPERIENCE</p>
        <p className="hidden font-sans text-[10px] tracking-[0.35em] text-bone/75 md:block md:text-[11px]">03 <span className="mx-2">—</span> THE SACRED TREE</p>
      </header>

      <div className="absolute bottom-28 left-6 right-6 max-w-[31rem] opacity-0 md:bottom-auto md:left-[7vw] md:right-auto md:top-1/2 md:-translate-y-1/2" data-layer="tree-copy-seed">
        <p className="font-sans text-[10px] tracking-[0.36em] text-[#e4d7b3] md:text-[11px]">01 / RESONANCE</p>
        <h2 className="mt-4 font-serif text-[clamp(2.6rem,5.3vw,5.4rem)] font-light leading-[0.95] tracking-[0.04em] text-bone">木心回响</h2>
        <p className="mt-5 max-w-sm font-sans text-[13px] leading-[2] tracking-wide text-bone/80 md:text-[15px]">最后一道年轮亮起。沉睡的根，沿着时间的纹路向土壤深处探去。</p>
        <p className="mt-5 font-serif text-lg italic tracking-wide text-bone/70">The old heart begins to beat again.</p>
      </div>

      <div className="absolute bottom-28 left-6 right-6 max-w-[31rem] opacity-0 md:bottom-auto md:left-[7vw] md:right-auto md:top-1/2 md:-translate-y-1/2" data-layer="tree-copy-sprout">
        <p className="font-sans text-[10px] tracking-[0.36em] text-[#e4d7b3] md:text-[11px]">02 / AWAKENING</p>
        <h2 className="mt-4 font-serif text-[clamp(2.6rem,5.3vw,5.4rem)] font-light leading-[0.95] tracking-[0.04em] text-bone">一粒微光</h2>
        <p className="mt-5 max-w-sm font-sans text-[13px] leading-[2] tracking-wide text-bone/80 md:text-[15px]">裂隙之间，新芽破木而出。古老的树身，再次听见风的方向。</p>
        <p className="mt-5 font-serif text-lg italic tracking-wide text-bone/70">A new green breath rises through the grain.</p>
      </div>

      <div className="absolute bottom-28 left-6 right-6 max-w-[31rem] opacity-0 md:bottom-auto md:left-[7vw] md:right-auto md:top-1/2 md:-translate-y-1/2" data-layer="tree-copy-ascent">
        <p className="font-sans text-[10px] tracking-[0.36em] text-[#e4d7b3] md:text-[11px]">03 / ASCENT</p>
        <h2 className="mt-4 font-serif text-[clamp(2.6rem,5.3vw,5.4rem)] font-light leading-[0.95] tracking-[0.04em] text-bone">向天而生</h2>
        <p className="mt-5 max-w-sm font-sans text-[13px] leading-[2] tracking-wide text-bone/80 md:text-[15px]">枝干穿过雾气，向天空伸展。每一条新枝，都牵起一段未尽的记忆。</p>
        <p className="mt-5 font-serif text-lg italic tracking-wide text-bone/70">Branches carry memory into the light.</p>
      </div>

      <div className="absolute bottom-28 left-6 right-6 max-w-[31rem] opacity-0 md:bottom-auto md:left-[7vw] md:right-auto md:top-1/2 md:-translate-y-1/2" data-layer="tree-copy-ceremony">
        <p className="font-sans text-[10px] tracking-[0.36em] text-[#e4d7b3] md:text-[11px]">04 / CEREMONY</p>
        <h2 className="mt-4 font-serif text-[clamp(2.6rem,5.3vw,5.4rem)] font-light leading-[0.95] tracking-[0.04em] text-bone">万叶成仪</h2>
        <p className="mt-5 max-w-sm font-sans text-[13px] leading-[2] tracking-wide text-bone/80 md:text-[15px]">叶影交叠，微光回旋。在想象与记忆之间，神木成为守望的所在。</p>
        <p className="mt-5 font-serif text-lg italic tracking-wide text-bone/70">A quiet guardian for all that remains.</p>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-gradient-to-t from-[#07100b]/90 via-[#07100b]/45 to-transparent px-6 pb-8 pt-24 opacity-0 md:flex-row md:items-end md:justify-between md:px-12 md:pb-11" data-layer="tree-finale">
        <div className="flex items-center gap-5">
          <span className="font-sans text-[10px] tracking-[0.4em] text-bone/60">03 / 03</span>
          <span className="h-px w-10 bg-bone/40" aria-hidden="true" />
          <p className="font-serif text-xl italic text-bone md:text-2xl">长生不息 · The forest remembers</p>
        </div>
        <p className="font-sans text-[10px] leading-relaxed tracking-[0.3em] text-bone/60 md:text-right">在光影之间，停留片刻<br />向上滚动 · 回到年轮的起点</p>
      </div>

      <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-3 opacity-0 md:right-12 md:flex" data-layer="tree-progress-markers" aria-hidden="true">
        <span className="font-sans text-[9px] tracking-[0.3em] text-bone/55">03</span>
        <span className="h-24 w-px bg-bone/20"><span className="block h-full w-full origin-top scale-y-0 bg-[#d6bf88]" data-layer="tree-progress-fill" /></span>
        <span className="font-sans text-[9px] tracking-[0.3em] text-bone/45">03</span>
      </div>
    </div>
  )
}

const COPY_WINDOWS = [
  { name: 'tree-copy-seed', start: 0.08, full: 0.2, end: 0.31 },
  { name: 'tree-copy-sprout', start: 0.28, full: 0.39, end: 0.52 },
  { name: 'tree-copy-ascent', start: 0.49, full: 0.61, end: 0.75 },
  { name: 'tree-copy-ceremony', start: 0.72, full: 0.83, end: 0.94 },
]

export function renderSacredTree(stage: HTMLElement, progress: number) {
  const p = progress
  const environment = layer(stage, 'tree-environment')
  if (environment) {
    const reveal = easeOutCubic(range(p, 0.01, 0.25))
    const settle = easeInOutCubic(range(p, 0.02, 0.82))
    environment.style.opacity = String(reveal)
    environment.style.transform = `scale(${1.72 - settle * 0.64}) translate3d(${settle * -0.55}%, ${settle * 0.12}%, 0)`
    environment.style.filter = `brightness(${0.78 + settle * 0.16}) saturate(${0.85 + settle * 0.18}) blur(${(1 - reveal) * 6}px)`
  }

  const oldOverlay = layer(stage, 'relic-overlay-root')
  if (oldOverlay) oldOverlay.style.opacity = String(1 - easeInOutCubic(range(p, 0.01, 0.15)))
  const gateFog = layer(stage, 'fog')
  if (gateFog) gateFog.style.opacity = String(0.35 * (1 - easeInOutCubic(range(p, 0, 0.2))))
  const gateVignette = layer(stage, 'vignette')
  if (gateVignette) gateVignette.style.opacity = String(0.3 * (1 - easeInOutCubic(range(p, 0, 0.2))))
  const canvas = layer(stage, 'tree-canvas-wrap')
  if (canvas) canvas.style.opacity = String(easeOutCubic(range(p, 0.06, 0.4)))
  const shade = layer(stage, 'tree-copy-shade')
  if (shade) shade.style.opacity = String(0.48 + easeOutCubic(range(p, 0.6, 0.95)) * 0.36)
  const glow = layer(stage, 'tree-awakening-glow')
  if (glow) glow.style.opacity = String(0.15 + Math.sin(range(p, 0.06, 0.42) * Math.PI) * 0.62 + range(p, 0.78, 0.99) * 0.18)
  const vignette = layer(stage, 'tree-vignette')
  if (vignette) vignette.style.opacity = String(0.48 + easeOutCubic(range(p, 0.72, 1)) * 0.24)
  const ground = layer(stage, 'tree-ground-shadow')
  if (ground) ground.style.opacity = String(easeOutCubic(range(p, 0.3, 0.85)) * 0.9)

  for (const window of COPY_WINDOWS) {
    const element = layer(stage, window.name)
    if (!element) continue
    const fadeIn = easeOutCubic(range(p, window.start, window.full))
    const fadeOut = easeInOutCubic(range(p, window.full + 0.02, window.end))
    element.style.opacity = String(fadeIn * (1 - fadeOut))
    element.style.transform = `translate3d(0, ${(1 - fadeIn) * 20 - fadeOut * 16}px, 0)`
    element.style.filter = `blur(${(1 - fadeIn) * 4 + fadeOut * 4}px)`
  }

  const header = layer(stage, 'tree-header')
  if (header) header.style.opacity = String(easeOutCubic(range(p, 0.08, 0.22)))
  const finale = layer(stage, 'tree-finale')
  if (finale) {
    const reveal = easeOutCubic(range(p, 0.9, 0.985))
    finale.style.opacity = String(reveal)
    finale.style.transform = `translate3d(0, ${(1 - reveal) * 18}px, 0)`
  }
  const marker = layer(stage, 'tree-progress-markers')
  if (marker) marker.style.opacity = String(easeOutCubic(range(p, 0.12, 0.3)))
  const fill = layer(stage, 'tree-progress-fill')
  if (fill) fill.style.transform = `scaleY(${p})`
}
