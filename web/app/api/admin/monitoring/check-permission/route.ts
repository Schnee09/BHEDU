/**
 * Permissions Check API
 * POST /api/admin/monitoring/check-permission
 * 
 * Check if a role has permission for a resource/action
 */

import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import {
  hasPermission,
  checkPermissionWithConditions,
  getRolePermissions,
  describePermission,
  type Resource,
  type Action
} from '@/lib/auth/permissions'

export async function POST(request: Request) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { role, resource, action, context } = body as {
      role: string
      resource: Resource
      action: Action
      context?: {
        userId?: string
        resourceOwnerId?: string
        userClassIds?: string[]
        resourceClassId?: string
      }
    }

    if (!role || !resource || !action) {
      return NextResponse.json(
        { error: 'role, resource, and action are required' },
        { status: 400 }
      )
    }

    // Check basic permission
    const hasBasicPermission = hasPermission(role, resource, action)

    // Check with conditions if context provided
    const hasFullPermission = context
      ? checkPermissionWithConditions(role, resource, action, context)
      : hasBasicPermission

    // Get all permissions for role
    const allPermissions = getRolePermissions(role)
    const relevantPermission = allPermissions.find(
      p => p.resource === resource && p.action === action
    )

    return NextResponse.json({
      success: true,
      result: {
        hasBasicPermission,
        hasFullPermission,
        permission: relevantPermission
          ? {
              ...relevantPermission,
              description: describePermission(relevantPermission)
            }
          : null
      },
      role,
      resource,
      action,
      context
    })
  } catch (error) {
    console.error('Permission check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    if (!role) {
      return NextResponse.json(
        { error: 'role parameter is required' },
        { status: 400 }
      )
    }

    const permissions = getRolePermissions(role)
    const described = permissions.map(p => ({
      ...p,
      description: describePermission(p)
    }))

    return NextResponse.json({
      success: true,
      role,
      permissions: described
    })
  } catch (error) {
    console.error('Get permissions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
