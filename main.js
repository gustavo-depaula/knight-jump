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

var board2 = Chessboard("myBoard", {
  draggable: true,
  dropOffBoard: "trash",
  sparePieces: true,
  pieceTheme,
});

$("#startBtn").on("click", board2.start);
$("#clearBtn").on("click", board2.clear);
