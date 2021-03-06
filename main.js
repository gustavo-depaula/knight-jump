$("img").each((i, e) =>
  e.setAttribute("src", "https://chessboardjs.com/" + e.getAttribute("src"))
);
function pieceTheme(piece) {
  // cheesboardjs theme for white pieces
  if (piece.search(/w/) !== -1) {
    return (
      "https://chessboardjs.com/img/chesspieces/wikipedia/" + piece + ".png"
    );
  }

  // alpha theme for black pieces
  return "https://chessboardjs.com/img/chesspieces/alpha/" + piece + ".png";
}

const defaultOptions = {
  draggable: true,
  dropOffBoard: "trash",
  // position: "start",
  sparePieces: true,
  pieceTheme,
};

var board = Chessboard("myBoard", defaultOptions);
function remakeBoard(options = {}) {
  const position = board.fen();
  board.destroy();
  const newBoard = Chessboard("myBoard", {
    ...defaultOptions,
    ...options,
    position,
  });
  board = newBoard;
}

function genericProblemSearch(problem, fringeDataStructure) {
  const startingNode = problem.getStartState();
  const visitedNodes = new Set();
  const visitNode = (node) => visitedNodes.add(node);
  const hasVisitedNode = (node) => visitedNodes.has(node);

  const isTargetNode = (node) => problem.isGoalState(node);
  const getSuccessors = (node) => problem.getSuccessors(node);
  const getNext = (node) =>
    getSuccessors(node).filter((node) => !hasVisitedNode(node));

  const fringe = new fringeDataStructure();
  fringe.push([startingNode]);

  while (fringe.length) {
    const candidate = fringe.shift();
    const node = candidate[candidate.length - 1];

    if (isTargetNode(node)) {
      return candidate;
    }

    if (!hasVisitedNode(node)) {
      visitNode(node);

      const ns = getNext(node);
      ns.forEach((n) => {
        const newCandidate = [...candidate, n];
        fringe.push(newCandidate);
      });
    }
  }
}

function findPath(originalSquare, targetSquare) {
  const chess = new Chess(`${board.fen()} w - - 1 45`);
  const piece = chess.get(originalSquare);
  const getSquare = (move) => move.slice(1);
  const moves = genericProblemSearch(
    {
      getStartState: () => `${piece.type.toUpperCase()}${originalSquare}`,
      isGoalState: (square) => targetSquare === getSquare(square),
      getSuccessors: (move) => {
        chess.remove(originalSquare);
        const square = getSquare(move);
        if (chess.put(piece, square)) {
          const moves = chess.moves({ square });
          if (square !== originalSquare) {
            chess.remove(square);
          }
          return moves
            .map((m) => m.replace("#", ""))
            .map((m) => m.replace("+", ""));
        }
        return [];
      },
    },
    Array
  );

  if (!moves) {
    console.log("couldn't do it");
    return;
  }

  const makeAMove = (moves) => {
    const [from, to, ...rest] = moves;
    board.move(`${getSquare(from)}-${getSquare(to)}`);
    if (rest.length) {
      setTimeout(() => {
        makeAMove([to, ...rest]);
      }, 1000);
    } else {
      setTimeout(() => {
        makeTransition("restart");
      }, 1000);
    }
  };

  makeAMove(moves);
}

function watchSquareClick() {
  $("img").on("click", (e) => {
    const parent = e.target.parentElement;
    const square = parent.dataset.square;
    if (!square) {
      return;
    }
    e.stopPropagation();
    makeTransition("selectSquare", square);
  });

  $("div").on("click", (e) => {
    const square = e.target.dataset.square;
    if (square) {
      e.stopPropagation();
      makeTransition("selectSquare", square);
    }
  });
}

const findJumpStateEnum = {
  inactive: "inactive",
  selectingPiece: "selectingPiece",
  selectingTarget: "selectingTarget",
  findingPath: "findingPath",
};
const findJumpStateMachine = {
  inactive: {
    onEnter: () => {
      remakeBoard({ draggable: true, sparePieces: true });
      $("#findJump").prop("disabled", false);
    },
    findJump: () => {
      return findJumpStateEnum.selectingPiece;
    },
  },
  selectingPiece: {
    onEnter: () => {
      $("#findJump").prop("disabled", true);
      $("#message").html("Select Piece...");
      remakeBoard({ draggable: false, sparePieces: false });
      watchSquareClick();
    },
    selectSquare: (square) => {
      findJumpStateContext.originalSquare = square;
      $("#message").html(`${square} selected! Select target square...`);
      return findJumpStateEnum.selectingTarget;
    },
  },
  selectingTarget: {
    selectSquare: (square) => {
      findJumpStateContext.targetSquare = square;
      $("#message").html(
        `Original Square ${findJumpStateContext.originalSquare}, Target square ${findJumpStateContext.targetSquare}`
      );
      return findJumpStateEnum.findingPath;
    },
  },
  findingPath: {
    onEnter: () => {
      const { originalSquare, targetSquare } = findJumpStateContext;
      findPath(originalSquare, targetSquare);
    },
    restart: () => {
      return findJumpStateEnum.inactive;
    },
  },
};

let findJumpState = findJumpStateEnum.inactive;
const makeTransition = (t, ...args) => {
  const currentState = findJumpState;
  const transitions = findJumpStateMachine[currentState];
  const transition = transitions[t] || (() => currentState);

  findJumpState = transition(...args);

  onEnter = findJumpStateMachine[findJumpState].onEnter || (() => {});
  let returned = onEnter();
  while (returned) {
    findJumpState = returned;
    onEnter = findJumpStateMachine[findJumpState].onEnter || (() => {});
    returned = onEnter();
  }
};
let findJumpStateContext = {
  originalSquare: null,
  targetSquare: null,
};

$("#startBtn").on("click", board.start);
$("#clearBtn").on("click", board.clear);
$("#findJump").on("click", () => makeTransition("findJump"));
