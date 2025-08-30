/**
 * メモリ最適化とリソース管理ユーティリティ
 * 3Dオブジェクト、テクスチャ、ジオメトリのメモリ効率化
 */

import * as THREE from 'three';
import { performanceMonitor } from './performance';

export interface ResourceInfo {
  id: string;
  type: 'geometry' | 'material' | 'texture' | 'mesh';
  memoryUsage: number; // bytes
  lastUsed: number;
  priority: 'high' | 'medium' | 'low';
  canDispose: boolean;
}

export interface OptimizationConfig {
  maxMemoryUsage: number; // MB
  textureMaxSize: number; // pixels
  autoOptimize: boolean;
  disposeUnusedAfter: number; // ms
  enableGeometryMerging: boolean;
  enableInstancedMeshes: boolean;
}

class MemoryManager {
  private resources: Map<string, ResourceInfo> = new Map();
  private disposedResources: Set<string> = new Set();
  private geometryCache: Map<string, THREE.BufferGeometry> = new Map();
  private materialCache: Map<string, THREE.Material> = new Map();
  private textureCache: Map<string, THREE.Texture> = new Map();
  
  public config: OptimizationConfig = {
    maxMemoryUsage: 200, // MB
    textureMaxSize: 1024, // 1024x1024
    autoOptimize: true,
    disposeUnusedAfter: 30000, // 30秒
    enableGeometryMerging: true,
    enableInstancedMeshes: true
  };

  /**
   * リソースを登録・追跡
   */
  registerResource(
    id: string,
    resource: THREE.Object3D | THREE.Material | THREE.Texture | THREE.BufferGeometry,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): void {
    const memoryUsage = this.calculateMemoryUsage(resource);
    
    const resourceInfo: ResourceInfo = {
      id,
      type: this.getResourceType(resource),
      memoryUsage,
      lastUsed: Date.now(),
      priority,
      canDispose: priority !== 'high'
    };

    this.resources.set(id, resourceInfo);
    
    // キャッシュに保存
    this.cacheResource(id, resource);
    
    if (this.config.autoOptimize) {
      this.checkMemoryPressure();
    }
  }

  /**
   * リソースの使用を記録
   */
  markResourceUsed(id: string): void {
    const resource = this.resources.get(id);
    if (resource) {
      resource.lastUsed = Date.now();
      this.resources.set(id, resource);
    }
  }

  /**
   * 未使用リソースのクリーンアップ
   */
  cleanup(): void {
    const currentTime = Date.now();
    const toDispose: string[] = [];

    this.resources.forEach((resource, id) => {
      if (
        resource.canDispose &&
        resource.priority === 'low' &&
        currentTime - resource.lastUsed > this.config.disposeUnusedAfter
      ) {
        toDispose.push(id);
      }
    });

    toDispose.forEach(id => this.disposeResource(id));
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🧹 Memory cleanup: disposed ${toDispose.length} resources`);
    }
  }

  /**
   * リソースの破棄
   */
  disposeResource(id: string): void {
    const resource = this.resources.get(id);
    if (!resource || this.disposedResources.has(id)) return;

    // キャッシュから取得して破棄
    const cachedResource = this.getCachedResource(id, resource.type);
    if (cachedResource) {
      this.disposeThreeJSResource(cachedResource);
    }

    // キャッシュから削除
    this.removeCachedResource(id, resource.type);
    
    this.resources.delete(id);
    this.disposedResources.add(id);
  }

  /**
   * テクスチャの最適化
   */
  optimizeTexture(texture: THREE.Texture, maxSize: number = this.config.textureMaxSize): THREE.Texture {
    if (!texture.image) return texture;

    const { width, height } = texture.image;
    
    if (width > maxSize || height > maxSize) {
      // テクスチャサイズを縮小
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const scale = Math.min(maxSize / width, maxSize / height);
      canvas.width = Math.floor(width * scale);
      canvas.height = Math.floor(height * scale);
      
      if (ctx) {
        ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
        
        // 新しいテクスチャを作成
        const optimizedTexture = new THREE.CanvasTexture(canvas);
        optimizedTexture.wrapS = texture.wrapS;
        optimizedTexture.wrapT = texture.wrapT;
        optimizedTexture.minFilter = THREE.LinearFilter;
        optimizedTexture.magFilter = THREE.LinearFilter;
        
        // 元のテクスチャを破棄
        texture.dispose();
        
        return optimizedTexture;
      }
    }
    
    // ミップマップの最適化
    if (texture.generateMipmaps && (width & (width - 1)) !== 0) {
      // 2の累乗でない場合はミップマップを無効化
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
    }
    
    return texture;
  }

  /**
   * ジオメトリの最適化
   */
  optimizeGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
    // Three.js 0.160.0 では mergeVertices は BufferGeometryUtils に移動
    // ここでは基本的な最適化のみ実行
    
    // 法線を再計算
    geometry.computeVertexNormals();
    
    // バウンディングボックス/スフィアを計算
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    
    // インデックスを追加（存在しない場合）
    if (!geometry.index) {
      geometry.setIndex(Array.from({ length: geometry.attributes.position.count }, (_, i) => i));
    }
    
    return geometry;
  }

  /**
   * インスタンス化されたメッシュの作成
   */
  createInstancedMesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    count: number
  ): THREE.InstancedMesh {
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    
    // 各インスタンスに変換行列を設定
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      matrix.setPosition(
        Math.random() * 100 - 50,
        Math.random() * 100 - 50,
        Math.random() * 100 - 50
      );
      instancedMesh.setMatrixAt(i, matrix);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
    
    return instancedMesh;
  }

  /**
   * マテリアルの最適化
   */
  optimizeMaterial(material: THREE.Material): THREE.Material {
    if (material instanceof THREE.MeshStandardMaterial) {
      // 不要な機能を無効化してパフォーマンス向上
      if (!material.map) {
        material.color.setHex(0xcccccc); // デフォルトカラー
      }
      
      // 環境マップが不要な場合は削除
      if (material.envMap && material.envMapIntensity === 0) {
        material.envMap = null;
      }
    } else if (material instanceof THREE.MeshPhongMaterial) {
      // MeshPhongMaterial用の最適化
      if (!material.map) {
        material.color.setHex(0xcccccc);
      }
      
      // 環境マップがある場合の処理
      if (material.envMap) {
        material.envMap = null; // パフォーマンス向上のため削除
      }
    }
    
    return material;
  }

  /**
   * メモリ使用量の計算
   */
  private calculateMemoryUsage(resource: any): number {
    if (resource instanceof THREE.BufferGeometry) {
      let size = 0;
      Object.values(resource.attributes).forEach(attr => {
        size += (attr as THREE.BufferAttribute).array.byteLength;
      });
      if (resource.index) {
        size += resource.index.array.byteLength;
      }
      return size;
    }
    
    if (resource instanceof THREE.Texture && resource.image) {
      const { width = 0, height = 0 } = resource.image;
      return width * height * 4; // RGBA
    }
    
    if (resource instanceof THREE.Material) {
      return 1024; // 概算
    }
    
    return 0;
  }

  /**
   * リソースタイプの判定
   */
  private getResourceType(resource: any): ResourceInfo['type'] {
    if (resource instanceof THREE.BufferGeometry) return 'geometry';
    if (resource instanceof THREE.Material) return 'material';
    if (resource instanceof THREE.Texture) return 'texture';
    return 'mesh';
  }

  /**
   * リソースをキャッシュに保存
   */
  private cacheResource(id: string, resource: any): void {
    if (resource instanceof THREE.BufferGeometry) {
      this.geometryCache.set(id, resource);
    } else if (resource instanceof THREE.Material) {
      this.materialCache.set(id, resource);
    } else if (resource instanceof THREE.Texture) {
      this.textureCache.set(id, resource);
    }
  }

  /**
   * キャッシュからリソースを取得
   */
  private getCachedResource(id: string, type: ResourceInfo['type']): any {
    switch (type) {
      case 'geometry': return this.geometryCache.get(id);
      case 'material': return this.materialCache.get(id);
      case 'texture': return this.textureCache.get(id);
      default: return null;
    }
  }

  /**
   * キャッシュからリソースを削除
   */
  private removeCachedResource(id: string, type: ResourceInfo['type']): void {
    switch (type) {
      case 'geometry': this.geometryCache.delete(id); break;
      case 'material': this.materialCache.delete(id); break;
      case 'texture': this.textureCache.delete(id); break;
    }
  }

  /**
   * Three.jsリソースの破棄
   */
  private disposeThreeJSResource(resource: any): void {
    if (resource && typeof resource.dispose === 'function') {
      resource.dispose();
    }
  }

  /**
   * メモリ圧迫状況の確認
   */
  private checkMemoryPressure(): void {
    const totalMemory = this.getTotalMemoryUsage();
    
    if (totalMemory > this.config.maxMemoryUsage * 1024 * 1024) {
      this.forceCleanup();
    }
  }

  /**
   * 強制クリーンアップ
   */
  private forceCleanup(): void {
    // 優先度の低いリソースから破棄
    const sortedResources = Array.from(this.resources.entries())
      .filter(([_, resource]) => resource.canDispose)
      .sort((a, b) => {
        const priorityOrder = { low: 0, medium: 1, high: 2 };
        return priorityOrder[a[1].priority] - priorityOrder[b[1].priority];
      });

    const toDispose = sortedResources.slice(0, Math.ceil(sortedResources.length * 0.3));
    toDispose.forEach(([id]) => this.disposeResource(id));

    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ Memory pressure detected: disposed ${toDispose.length} resources`);
    }
  }

  /**
   * 総メモリ使用量の取得
   */
  getTotalMemoryUsage(): number {
    return Array.from(this.resources.values())
      .reduce((total, resource) => total + resource.memoryUsage, 0);
  }

  /**
   * メモリ統計の取得
   */
  getMemoryStats() {
    const stats = {
      totalResources: this.resources.size,
      totalMemoryMB: this.getTotalMemoryUsage() / (1024 * 1024),
      byType: {
        geometry: 0,
        material: 0,
        texture: 0,
        mesh: 0
      },
      byPriority: {
        high: 0,
        medium: 0,
        low: 0
      }
    };

    this.resources.forEach(resource => {
      stats.byType[resource.type]++;
      stats.byPriority[resource.priority]++;
    });

    return stats;
  }

  /**
   * 設定の更新
   */
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// シングルトンインスタンス
export const memoryManager = new MemoryManager();

/**
 * ジオメトリの結合（LOD用）
 */
export function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const mergedGeometry = new THREE.BufferGeometry();
  
  // 位置、法線、UVを結合
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  
  geometries.forEach(geometry => {
    const posArray = geometry.attributes.position?.array as Float32Array;
    const normArray = geometry.attributes.normal?.array as Float32Array;
    const uvArray = geometry.attributes.uv?.array as Float32Array;
    
    if (posArray) positions.push(...Array.from(posArray));
    if (normArray) normals.push(...Array.from(normArray));
    if (uvArray) uvs.push(...Array.from(uvArray));
  });
  
  mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length) mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  if (uvs.length) mergedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  
  return memoryManager.optimizeGeometry(mergedGeometry);
}

/**
 * 自動クリーンアップの開始
 */
export function startMemoryManagement(interval: number = 10000): void {
  setInterval(() => {
    memoryManager.cleanup();
    
    if (process.env.NODE_ENV === 'development') {
      const stats = memoryManager.getMemoryStats();
      console.log(`📊 Memory Stats: ${stats.totalMemoryMB.toFixed(2)}MB, ${stats.totalResources} resources`);
    }
  }, interval);
}