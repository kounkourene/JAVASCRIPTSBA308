function validateData(courseInfo, assignmentGroups) {
  for (let group of assignmentGroups) {
    if (group.course_id !== courseInfo.id) {
      throw new Error(
        `Assignment group ${group.id} does not belong to course ${courseInfo.id}`
      );
    }
  }
}

function processSubmissions(learnerSubmissions, assignmentGroups) {
  let learnerData = {};

  for (let submission of learnerSubmissions) {
    const {
      learner_id,
      assignment_id,
      submission: { score, submitted_at },
    } = submission;

    if (!learnerData[learner_id]) {
      learnerData[learner_id] = {};
    }

    learnerData[learner_id][assignment_id] = {
      score,
      submitted_at: new Date(submitted_at),
    };
  }

  for (let group of assignmentGroups) {
    for (let assignment of group.assignments) {
      const { id, due_at, points_possible } = assignment;

      for (let learnerId in learnerData) {
        if (learnerData[learnerId][id]) {
          learnerData[learnerId][id] = {
            ...learnerData[learnerId][id],
            due_at: new Date(due_at),
            points_possible,
            group_weight: group.group_weight,
          };
        }
      }
    }
  }

  return learnerData;
}

function calculateWeightedAverage(learnerData) {
  let results = [];

  for (let learnerId in learnerData) {
    let totalScore = 0;
    let totalPossible = 0;
    let scores = {};

    for (let assignmentId in learnerData[learnerId]) {
      let { due_at, submitted_at, points_possible, score } = learnerData[
        learnerId
      ][assignmentId];

      if (points_possible === 0 || isNaN(points_possible)) {
        continue;
      }

      if (submitted_at > due_at) {
        score -= 0.1 * points_possible;
      }

      if (submitted_at <= due_at) {
        scores[assignmentId] = score / points_possible;
        totalScore += score;
        totalPossible += points_possible;
      }
    }

    let avg = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;

    results.push({
      id: parseInt(learnerId),
      avg,
      ...scores,
    });
  }

  return results;
}

function getLearnerData(courseInfo, assignmentGroups, learnerSubmissions) {
  try {
    validateData(courseInfo, assignmentGroups);
    let learnerData = processSubmissions(learnerSubmissions, assignmentGroups);
    let results = calculateWeightedAverage(learnerData);
    return results;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return [];
  }
}

// Example usage:
const courseInfo = {
  id: 1,
  name: "Course 1",
};

const assignmentGroups = [
  {
    id: 1,
    name: "Group 1",
    course_id: 1,
    group_weight: 0.3,
    assignments: [
      {
        id: 101,
        name: "Assignment 1",
        due_at: "2023-01-15T23:59:59Z",
        points_possible: 100,
      },
      {
        id: 102,
        name: "Assignment 2",
        due_at: "2023-02-15T23:59:59Z",
        points_possible: 100,
      },
    ],
  },
];

const learnerSubmissions = [
  {
    learner_id: 1,
    assignment_id: 101,
    submission: {
      submitted_at: "2023-01-14T23:59:59Z",
      score: 80,
    },
  },
  {
    learner_id: 1,
    assignment_id: 102,
    submission: {
      submitted_at: "2023-02-16T23:59:59Z",
      score: 90,
    },
  },
];

const results = getLearnerData(
  courseInfo,
  assignmentGroups,
  learnerSubmissions
);
console.log(results);
