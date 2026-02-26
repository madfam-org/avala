import { PrismaClient, Role, Plan, CriterionType } from "@prisma/client";
import { ec0249Templates, ec0249Summary } from "./seeds/ec0249-templates";
import {
  ec0249Assessments,
  ec0249AssessmentSummary,
} from "./seeds/ec0249-assessments";
import { achievements, achievementsSummary } from "./seeds/achievements";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // 1. Create default tenant
  console.log("Creating default tenant...");
  const tenant = await prisma.tenant.upsert({
    where: { slug: "madfam" },
    update: {},
    create: {
      name: "Innovaciones MADFAM",
      slug: "madfam",
      plan: Plan.ENTERPRISE,
      settings: {
        locale: "es-MX",
        timezone: "America/Mexico_City",
        features: {
          ec_mapping: true,
          dc3_generation: true,
          sirce_export: true,
          obv3_credentials: true,
        },
      },
    },
  });
  console.log(`✓ Tenant created: ${tenant.name} (${tenant.id})\n`);

  // 2. Create admin user
  console.log("Creating admin user...");
  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: "admin@avala.local",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@avala.local",
      firstName: "Admin",
      lastName: "AVALA",
      role: Role.ADMIN,
      metadata: {
        note: "Default admin user - change password immediately",
      },
    },
  });
  console.log(`✓ Admin user: ${admin.email}\n`);

  // 3. Create sample users for different roles
  console.log("Creating sample users...");

  const instructor = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: "instructor@avala.local",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "instructor@avala.local",
      firstName: "María",
      lastName: "Instructor",
      role: Role.INSTRUCTOR,
    },
  });

  const assessor = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: "assessor@avala.local",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "assessor@avala.local",
      firstName: "Carlos",
      lastName: "Evaluador",
      role: Role.ASSESSOR,
    },
  });

  const trainee = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: "trainee@avala.local",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "trainee@avala.local",
      firstName: "Juan",
      lastName: "Aprendiz",
      role: Role.TRAINEE,
    },
  });

  console.log(`✓ Created ${Role.INSTRUCTOR}: ${instructor.email}`);
  console.log(`✓ Created ${Role.ASSESSOR}: ${assessor.email}`);
  console.log(`✓ Created ${Role.TRAINEE}: ${trainee.email}\n`);

  // 4. Create sample EC (EC0217.01 - Impartición de cursos de formación)
  console.log("Creating sample Competency Standard (EC0217.01)...");

  const ec0217 = await prisma.competencyStandard.upsert({
    where: {
      tenantId_code_version: {
        tenantId: tenant.id,
        code: "EC0217.01",
        version: "1.0",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      issuer: "CONOCER",
      code: "EC0217.01",
      title:
        "Impartición de cursos de formación del capital humano de manera presencial grupal",
      version: "1.0",
      locale: "es-MX",
      structure: {
        description:
          "Este Estándar de Competencia establece el desempeño para impartir cursos de capacitación.",
        sectors: ["Capacitación y desarrollo"],
        level: 4,
      },
    },
  });
  console.log(`✓ EC created: ${ec0217.code} - ${ec0217.title}\n`);

  // 5. Create Elements for EC0217.01
  console.log("Creating Elements...");

  const element1 = await prisma.element.create({
    data: {
      standardId: ec0217.id,
      index: 1,
      title: "Preparar la sesión de instrucción",
      description:
        "Preparar el ambiente de aprendizaje y los recursos didácticos para la sesión.",
    },
  });

  const element2 = await prisma.element.create({
    data: {
      standardId: ec0217.id,
      index: 2,
      title: "Conducir la sesión de instrucción",
      description:
        "Facilitar el aprendizaje mediante técnicas didácticas apropiadas.",
    },
  });

  const element3 = await prisma.element.create({
    data: {
      standardId: ec0217.id,
      index: 3,
      title: "Evaluar el aprendizaje",
      description:
        "Aplicar instrumentos de evaluación y retroalimentar a los participantes.",
    },
  });

  console.log(`✓ Created 3 elements\n`);

  // 6. Create Criteria for Element 1
  console.log("Creating Criteria for Element 1...");

  await prisma.criterion.createMany({
    data: [
      {
        elementId: element1.id,
        type: CriterionType.DESEMPENO,
        code: "D1",
        text: "Prepara el espacio físico conforme a las necesidades del grupo y el programa.",
        weight: 1.0,
      },
      {
        elementId: element1.id,
        type: CriterionType.DESEMPENO,
        code: "D2",
        text: "Verifica el funcionamiento de los recursos didácticos y tecnológicos.",
        weight: 1.0,
      },
      {
        elementId: element1.id,
        type: CriterionType.PRODUCTO,
        code: "P1",
        text: "La carta descriptiva del curso está completa y actualizada.",
        weight: 1.0,
      },
      {
        elementId: element1.id,
        type: CriterionType.CONOCIMIENTO,
        code: "C1",
        text: "Conoce los estilos de aprendizaje y las teorías de aprendizaje para adultos.",
        weight: 1.0,
      },
    ],
  });

  // Create Criteria for Element 2
  await prisma.criterion.createMany({
    data: [
      {
        elementId: element2.id,
        type: CriterionType.DESEMPENO,
        code: "D3",
        text: "Presenta los objetivos de aprendizaje al inicio de la sesión.",
        weight: 1.0,
      },
      {
        elementId: element2.id,
        type: CriterionType.DESEMPENO,
        code: "D4",
        text: "Aplica técnicas didácticas variadas para mantener la participación.",
        weight: 1.0,
      },
      {
        elementId: element2.id,
        type: CriterionType.ACTITUD,
        code: "A1",
        text: "Muestra respeto e inclusión hacia todos los participantes.",
        weight: 1.0,
      },
    ],
  });

  // Create Criteria for Element 3
  await prisma.criterion.createMany({
    data: [
      {
        elementId: element3.id,
        type: CriterionType.DESEMPENO,
        code: "D5",
        text: "Aplica instrumentos de evaluación alineados a los objetivos.",
        weight: 1.0,
      },
      {
        elementId: element3.id,
        type: CriterionType.PRODUCTO,
        code: "P2",
        text: "El reporte de evaluación documenta el progreso de cada participante.",
        weight: 1.0,
      },
      {
        elementId: element3.id,
        type: CriterionType.CONOCIMIENTO,
        code: "C2",
        text: "Conoce técnicas de evaluación formativa y sumativa.",
        weight: 1.0,
      },
    ],
  });

  console.log(`✓ Created 10 criteria across 3 elements\n`);

  // 7. Create a sample course mapped to EC0217
  console.log("Creating sample course...");

  const course = await prisma.course.create({
    data: {
      tenantId: tenant.id,
      ownerId: instructor.id,
      code: "CURSO-EC0217-001",
      title: "Formación de Instructores Internos",
      description:
        "Curso para desarrollar competencias de instructores conforme EC0217.01",
      version: "1.0",
      status: "PUBLISHED",
      ecCodes: ["EC0217.01"],
      durationHours: 40,
      publishedAt: new Date(),
      standards: {
        connect: [{ id: ec0217.id }],
      },
    },
  });

  console.log(`✓ Course created: ${course.title}\n`);

  // 8. Create a Path
  console.log("Creating learning path...");

  const path = await prisma.path.create({
    data: {
      tenantId: tenant.id,
      title: "Certificación de Instructores",
      description: "Ruta para certificación interna como instructor",
      items: {
        create: [
          {
            courseId: course.id,
            order: 1,
            required: true,
          },
        ],
      },
    },
  });

  console.log(`✓ Path created: ${path.title}\n`);

  // 9. Create sample portfolio for trainee
  console.log("Creating sample portfolio...");

  const portfolio = await prisma.portfolio.create({
    data: {
      tenantId: tenant.id,
      traineeId: trainee.id,
      title: "Portfolio - EC0217.01",
      status: "DRAFT",
      summaryJson: {
        standardCode: "EC0217.01",
        progress: 0,
      },
    },
  });

  console.log(`✓ Portfolio created for ${trainee.email}\n`);

  // 10. Seed EC0249 Document Templates
  console.log("Creating EC0249 document templates...");

  for (const template of ec0249Templates) {
    await prisma.documentTemplate.upsert({
      where: { templateCode: template.templateCode },
      update: {
        title: template.title,
        titleEn: template.titleEn,
        element: template.element,
        elementName: template.elementName,
        category: template.category,
        icon: template.icon,
        description: template.description,
        estimatedTime: template.estimatedTime,
        videoId: template.videoId,
        videoTitle: template.videoTitle,
        videoDescription: template.videoDescription,
        evaluationCriteria: template.evaluationCriteria,
        sections: template.sections,
        orderIndex: template.orderIndex,
      },
      create: {
        templateCode: template.templateCode,
        title: template.title,
        titleEn: template.titleEn,
        element: template.element,
        elementName: template.elementName,
        category: template.category,
        icon: template.icon,
        description: template.description,
        estimatedTime: template.estimatedTime,
        videoId: template.videoId,
        videoTitle: template.videoTitle,
        videoDescription: template.videoDescription,
        evaluationCriteria: template.evaluationCriteria,
        sections: template.sections,
        orderIndex: template.orderIndex,
      },
    });
  }

  console.log(`✓ Created ${ec0249Summary.totalTemplates} document templates`);
  console.log(
    `  - Element 1 (E0875): ${ec0249Summary.element1Count} templates`,
  );
  console.log(
    `  - Element 2 (E0876): ${ec0249Summary.element2Count} templates`,
  );
  console.log(
    `  - Element 3 (E0877): ${ec0249Summary.element3Count} templates\n`,
  );

  // 11. Seed EC0249 Quizzes and Questions
  console.log("Creating EC0249 assessment quizzes...");

  for (const quizData of ec0249Assessments) {
    // Create or update the quiz
    const quiz = await prisma.quiz.upsert({
      where: { code: quizData.code },
      update: {
        title: quizData.title,
        titleEn: quizData.titleEn,
        description: quizData.description,
        moduleId: quizData.moduleId,
        elementId: quizData.elementId,
        category: quizData.category,
        timeLimit: quizData.timeLimit,
        passingScore: quizData.passingScore,
        allowedAttempts: quizData.allowedAttempts,
      },
      create: {
        tenantId: tenant.id,
        code: quizData.code,
        title: quizData.title,
        titleEn: quizData.titleEn,
        description: quizData.description,
        moduleId: quizData.moduleId,
        elementId: quizData.elementId,
        category: quizData.category,
        timeLimit: quizData.timeLimit,
        passingScore: quizData.passingScore,
        allowedAttempts: quizData.allowedAttempts,
      },
    });

    // Delete existing questions and recreate (for clean updates)
    await prisma.question.deleteMany({
      where: { quizId: quiz.id },
    });

    // Create questions for this quiz
    for (const questionData of quizData.questions) {
      await prisma.question.create({
        data: {
          quizId: quiz.id,
          type: questionData.type,
          questionText: questionData.questionText,
          explanation: questionData.explanation,
          points: questionData.points,
          competency: questionData.competency,
          questionData: questionData.questionData,
          orderIndex: questionData.orderIndex,
        },
      });
    }
  }

  console.log(
    `✓ Created ${ec0249AssessmentSummary.totalQuizzes} quizzes with ${ec0249AssessmentSummary.totalQuestions} questions`,
  );
  console.log(
    `  - Multiple Choice: ${ec0249AssessmentSummary.questionTypes.MULTIPLE_CHOICE} questions`,
  );
  console.log(
    `  - True/False: ${ec0249AssessmentSummary.questionTypes.TRUE_FALSE} questions`,
  );
  console.log(
    `  - Short Answer: ${ec0249AssessmentSummary.questionTypes.SHORT_ANSWER} questions\n`,
  );

  // 12. Seed Achievements for Gamification System
  console.log("Creating achievements for gamification...");

  for (const achievementData of achievements) {
    await prisma.achievement.upsert({
      where: { code: achievementData.code },
      update: {
        title: achievementData.title,
        titleEn: achievementData.titleEn,
        description: achievementData.description,
        descriptionEn: achievementData.descriptionEn,
        category: achievementData.category,
        rarity: achievementData.rarity,
        icon: achievementData.icon,
        points: achievementData.points,
        conditions: achievementData.conditions,
        orderIndex: achievementData.orderIndex,
      },
      create: {
        code: achievementData.code,
        title: achievementData.title,
        titleEn: achievementData.titleEn,
        description: achievementData.description,
        descriptionEn: achievementData.descriptionEn,
        category: achievementData.category,
        rarity: achievementData.rarity,
        icon: achievementData.icon,
        points: achievementData.points,
        conditions: achievementData.conditions,
        orderIndex: achievementData.orderIndex,
      },
    });
  }

  console.log(
    `✓ Created ${achievementsSummary.totalAchievements} achievements (${achievementsSummary.totalPoints} total points)`,
  );
  console.log(
    `  - First Steps: ${achievementsSummary.byCategory.FIRST_STEPS} achievements`,
  );
  console.log(
    `  - Modules: ${achievementsSummary.byCategory.MODULES} achievements`,
  );
  console.log(
    `  - Streaks: ${achievementsSummary.byCategory.STREAKS} achievements`,
  );
  console.log(
    `  - Performance: ${achievementsSummary.byCategory.PERFORMANCE} achievements`,
  );
  console.log(
    `  - Completion: ${achievementsSummary.byCategory.COMPLETION} achievements\n`,
  );

  // 13. Seed sample Employer
  console.log("Creating sample employer...");

  // Delete existing sample employers for idempotency, then recreate
  await prisma.employer.deleteMany({
    where: {
      tenantId: tenant.id,
      rfc: "MAD200101ABC",
    },
  });

  const employer = await prisma.employer.create({
    data: {
      tenantId: tenant.id,
      businessName: "Innovaciones MADFAM S.A.S. de C.V.",
      rfc: "MAD200101ABC",
      legalName: "Innovaciones MADFAM S.A.S. de C.V.",
      address: "Av. Insurgentes Sur 1234, Col. Del Valle, CDMX, C.P. 03100",
      workCenter: "CT-001",
      legalContact: "Aldo Ruiz Luna",
      email: "compliance@madfam.io",
      phone: "+52 55 1234 5678",
    },
  });

  console.log(`✓ Employer created: ${employer.businessName} (RFC: ${employer.rfc})\n`);

  // 14. Seed sample Credential Issuer
  console.log("Creating sample credential issuer...");

  const credentialIssuer = await prisma.credentialIssuer.upsert({
    where: { did: "did:web:avala.example.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      did: "did:web:avala.example.com",
      name: "AVALA Credential Issuer",
      description: "Official credential issuer for AVALA learning platform",
      publicKeyUrl: "https://avala.example.com/.well-known/did.json",
      privateKeyPath: "./keys/issuer.key",
    },
  });

  console.log(`✓ Credential Issuer created: ${credentialIssuer.name} (DID: ${credentialIssuer.did})\n`);

  console.log("✅ Seeding completed successfully!\n");
  console.log("📋 Summary:");
  console.log(`   - Tenant: ${tenant.name}`);
  console.log(`   - Users: 4 (admin, instructor, assessor, trainee)`);
  console.log(`   - EC Standards: 1 (EC0217.01)`);
  console.log(`   - Elements: 3`);
  console.log(`   - Criteria: 10`);
  console.log(`   - Courses: 1`);
  console.log(`   - Paths: 1`);
  console.log(`   - Portfolios: 1`);
  console.log(
    `   - Document Templates: ${ec0249Summary.totalTemplates} (EC0249)`,
  );
  console.log(
    `   - Quizzes: ${ec0249AssessmentSummary.totalQuizzes} with ${ec0249AssessmentSummary.totalQuestions} questions`,
  );
  console.log(
    `   - Achievements: ${achievementsSummary.totalAchievements} (${achievementsSummary.totalPoints} points)`,
  );
  console.log(`   - Employers: 1 (${employer.businessName})`);
  console.log(`   - Credential Issuers: 1 (${credentialIssuer.name})\n`);
  console.log("🔐 Login credentials:");
  console.log(`   Email: admin@avala.local`);
  console.log(`   Password: (set via auth system)\n`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
