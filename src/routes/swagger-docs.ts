/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: User unique identifier
 *         email:
 *           type: string
 *           format: email
 *         username:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         avatar:
 *           type: string
 *           nullable: true
 *         bio:
 *           type: string
 *           nullable: true
 *         isEmailVerified:
 *           type: boolean
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Post:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         content:
 *           type: string
 *         mediaUrls:
 *           type: array
 *           items:
 *             type: string
 *         visibility:
 *           type: string
 *           enum: [public, private, friends]
 *         authorId:
 *           type: string
 *         author:
 *           $ref: '#/components/schemas/User'
 *         isLiked:
 *           type: boolean
 *         _count:
 *           type: object
 *           properties:
 *             likes:
 *               type: number
 *             comments:
 *               type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         content:
 *           type: string
 *         postId:
 *           type: string
 *         authorId:
 *           type: string
 *         author:
 *           $ref: '#/components/schemas/User'
 *         parentId:
 *           type: string
 *           nullable: true
 *         isLiked:
 *           type: boolean
 *         _count:
 *           type: object
 *           properties:
 *             likes:
 *               type: number
 *             replies:
 *               type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *
 *     PaginationResult:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *         total:
 *           type: number
 *         page:
 *           type: number
 *         limit:
 *           type: number
 *         totalPages:
 *           type: number
 *         hasNextPage:
 *           type: boolean
 *         hasPreviousPage:
 *           type: boolean
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

